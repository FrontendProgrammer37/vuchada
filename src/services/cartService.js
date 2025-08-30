import apiService from './api';

const CART_ENDPOINT = '/cart';  // Removido /api/v1 pois já está na baseURL

// Função auxiliar para obter o sessionId
const getSessionId = () => {
  return localStorage.getItem('sessionId') || '';
};

const cartService = {
  // Adicionar item ao carrinho
  async addItem(productId, quantity = 1) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        headers: {
          'X-Session-ID': getSessionId()
        },
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  // Obter carrinho atual
  async getCart() {
    try {
      const response = await apiService.request(CART_ENDPOINT, {
        headers: {
          'X-Session-ID': getSessionId()
        }
      });
      return response;
    } catch (error) {
      // Se o carrinho não existir, retorna um carrinho vazio
      if (error.response?.status === 404) {
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      console.error('Erro ao buscar carrinho:', error);
      throw error;
    }
  },

  // Atualizar quantidade de um item
  async updateItemQuantity(productId, quantity) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/update`, {
        method: 'PUT',
        headers: {
          'X-Session-ID': getSessionId()
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
      const response = await apiService.request(`${CART_ENDPOINT}/remove`, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': getSessionId()
        },
        body: {
          product_id: productId
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
      const response = await apiService.request(CART_ENDPOINT, {
        method: 'DELETE',
        headers: {
          'X-Session-ID': getSessionId()
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      
      // Se for um erro 404, o carrinho já está vazio, então podemos considerar como sucesso
      if (error.response?.status === 404) {
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
      const response = await apiService.request(`${CART_ENDPOINT}/checkout`, {
        method: 'POST',
        headers: {
          'X-Session-ID': getSessionId()
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
