import apiService from './api';

const CART_ENDPOINT = '/api/v1/cart';

const cartService = {
  // Adicionar item ao carrinho
  async addItem(productId, quantity = 1) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
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
      const response = await apiService.request(CART_ENDPOINT);
      return response;
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
      throw error;
    }
  },

  // Finalizar compra
  async checkout(paymentMethod, customerId = null, notes = '') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/checkout`, {
        method: 'POST',
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
  },

  // Atualizar quantidade de um item
  async updateItemQuantity(productId, quantity) {
    try {
      // Se quantidade for 0 ou negativa, remove o item
      if (quantity <= 0) {
        return await this.removeItem(productId);
      }
      
      const response = await apiService.request(`${CART_ENDPOINT}/update`, {
        method: 'PUT',
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar item do carrinho:', error);
      throw error;
    }
  },

  // Remover item do carrinho
  async removeItem(productId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/remove`, {
        method: 'DELETE',
        body: { product_id: productId }
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
      const response = await apiService.request(`${CART_ENDPOINT}/clear`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    }
  }
};

export default cartService;
