import apiService from './api';

// Função auxiliar para obter o sessionId
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');
  
  // Se não existir um sessionId, gera um novo
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
    console.log('Novo sessionId gerado:', sessionId);
  }
  
  return sessionId;
};

const CART_BASE_URL = 'cart';

const cartService = {
  // Adicionar item ao carrinho
  async addItem(productId, quantity = 1) {
    try {
      console.log('Adicionando item ao carrinho:', { productId, quantity });
      const sessionId = getSessionId();
      
      const response = await apiService.request(`${CART_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      
      console.log('Resposta ao adicionar item:', response);
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  // Obter carrinho atual
  async getCart() {
    try {
      const sessionId = getSessionId();
      console.log('Obtendo carrinho. SessionId:', sessionId);
      
      const response = await apiService.request(CART_BASE_URL, {
        method: 'GET',
        headers: {
          'X-Session-ID': sessionId
        }
      });
      
      console.log('Carrinho obtido:', response);
      return response;
    } catch (error) {
      // Se o carrinho não existir (404), retorna um carrinho vazio
      if (error.status === 404) {
        console.log('Carrinho não encontrado, retornando carrinho vazio');
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      
      console.error('Erro ao buscar carrinho:', error);
      throw error;
    }
  },

  // Atualizar quantidade de um item
  async updateItemQuantity(productId, quantity) {
    try {
      console.log('Atualizando quantidade:', { productId, quantity });
      const sessionId = getSessionId();
      
      const response = await apiService.request(`${CART_BASE_URL}/update`, {
        method: 'PUT',
        headers: {
          'X-Session-ID': sessionId
        },
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
    }
  },

  // Remover item do carrinho
  async removeItem(productId) {
    try {
      console.log('Removendo item do carrinho:', productId);
      const sessionId = getSessionId();
      
      const response = await apiService.request(`${CART_BASE_URL}/items/${productId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': sessionId
        }
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },

  // Limpar carrinho
  async clearCart() {
    try {
      console.log('Limpando carrinho');
      const sessionId = getSessionId();
      
      const response = await apiService.request(CART_BASE_URL, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': sessionId
        }
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      
      // Se for um erro 404, o carrinho já está vazio, então podemos considerar como sucesso
      if (error.status === 404) {
        console.log('Carrinho já está vazio');
        return { success: true, message: 'Carrinho já está vazio' };
      }
      
      throw error;
    }
  },

  // Verificar se um item está no carrinho
  isInCart(items, productId) {
    return items.some(item => item.product_id === productId);
  },

  // Obter quantidade de um item no carrinho
  getItemQuantity(items, productId) {
    const item = items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  },

  // Finalizar compra/checkout
  async checkout(paymentMethod, customerId = null, notes = '') {
    try {
      console.log('Finalizando compra:', { paymentMethod, customerId, notes });
      const sessionId = getSessionId();
      
      const response = await apiService.request(`${CART_BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId
        },
        body: {
          payment_method: paymentMethod,
          customer_id: customerId,
          notes: notes
        }
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      throw error;
    }
  }
};

export default cartService;
