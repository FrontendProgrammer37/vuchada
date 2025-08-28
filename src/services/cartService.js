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
        body: { product_id: productId }
      });
      return response;
    } catch (error) {
      console.error('Erro ao remover item:', error);
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
  },

  // Verificar se um item está no carrinho
  isInCart(items, productId) {
    return items.some(item => item.product_id === productId);
  },

  // Obter quantidade de um item no carrinho
  getItemQuantity(items, productId) {
    const item = items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  }
};

export default cartService;
