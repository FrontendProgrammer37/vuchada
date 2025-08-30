import apiService from './api';

const CART_ENDPOINT = '/api/v1/cart';

const cartService = {
  // Adicionar item ao carrinho
  async addItem(productId, quantity = 1) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity: parseInt(quantity, 10)
        })
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  // Obter carrinho atual
  async getCart(sessionId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/${sessionId}`);
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
  async updateItemQuantity(productId, quantity, sessionId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/${sessionId}/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: parseInt(quantity, 10)
        })
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
    }
  },

  // Remover item do carrinho
  async removeItem(productId, sessionId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/${sessionId}/${productId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw error;
    }
  },

  // Limpar carrinho
  async clearCart(sessionId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/${sessionId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
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
  async checkout(sessionId) {
    try {
      const response = await apiService.request(`cart/checkout/${sessionId}`, {
        method: 'POST',
        body: {
          payment_method: 'dinheiro', // You might want to make this dynamic based on user selection
          items: (await this.getCart(sessionId)).items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        }
      });
      
      // Clear cart after successful checkout
      await this.clearCart(sessionId);
      
      return response;
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      throw error;
    }
  }
};

export default cartService;
