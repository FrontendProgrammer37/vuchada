import apiService from './api';

const CART_BASE_URL = '/cart';

const cartService = {
  /**
   * Adiciona um item ao carrinho
   * @param {number} productId - ID do produto
   * @param {number} [quantity=1] - Quantidade do produto
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async addItem(productId, quantity = 1, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_BASE_URL}/add?session_id=${sessionId}`, {
        method: 'POST',
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw new Error(error.message || 'Erro ao adicionar item ao carrinho');
    }
  },

  /**
   * Obtém o carrinho atual
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Dados do carrinho
   */
  async getCart(sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_BASE_URL}?session_id=${sessionId}`);
      return response;
    } catch (error) {
      if (error.status === 404) {
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      console.error('Erro ao buscar carrinho:', error);
      throw new Error(error.message || 'Erro ao buscar carrinho');
    }
  },

  /**
   * Remove um item do carrinho
   * @param {number} productId - ID do produto a ser removido
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async removeItem(productId, sessionId = 'default') {
    try {
      const response = await apiService.request(
        `${CART_BASE_URL}/cart/items/${productId}?session_id=${sessionId}`,
        { method: 'DELETE' }
      );
      return response;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw new Error(error.message || 'Erro ao remover item do carrinho');
    }
  },

  /**
   * Limpa todos os itens do carrinho
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async clearCart(sessionId = 'default') {
    try {
      // First, get the current cart to get all items
      const cart = await this.getCart(sessionId);
      
      // If cart is already empty, return early
      if (!cart.items || cart.items.length === 0) {
        return { success: true, message: 'O carrinho já está vazio' };
      }

      // Remove each item individually
      const removePromises = cart.items.map(item => 
        this.removeItem(item.product_id || item.id, sessionId)
          .then(() => ({ success: true }))
          .catch(error => {
            console.error(`Erro ao remover item ${item.product_id || item.id}:`, error);
            return { success: false, error };
          })
      );

      const results = await Promise.all(removePromises);
      const failedRemovals = results.filter(result => !result.success);
      
      if (failedRemovals.length > 0) {
        console.error('Alguns itens não puderam ser removidos:', failedRemovals);
        throw new Error(`Não foi possível remover ${failedRemovals.length} itens do carrinho`);
      }
      
      return { 
        success: true, 
        message: 'Carrinho limpo com sucesso',
        itemsRemoved: cart.items.length
      };
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw new Error(`Erro ao limpar carrinho: ${error.message}`);
    }
  },

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param {number} productId - ID do produto
   * @param {number} quantity - Nova quantidade
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async updateItemQuantity(productId, quantity, sessionId = 'default') {
    try {
      const response = await apiService.request(
        `${CART_BASE_URL}/cart/items/${productId}?session_id=${sessionId}`,
        {
          method: 'PUT',
          body: { quantity }
        }
      );
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade do item:', error);
      throw new Error(error.message || 'Erro ao atualizar quantidade do item');
    }
  },

  /**
   * Verifica se um item está no carrinho
   * @param {Array} items - Lista de itens do carrinho
   * @param {number} productId - ID do produto a ser verificado
   * @returns {boolean} Verdadeiro se o item estiver no carrinho
   */
  isInCart(items, productId) {
    return items.some(item => (item.product_id || item.id) === productId);
  },

  /**
   * Obtém a quantidade de um item no carrinho
   * @param {Array} items - Lista de itens do carrinho
   * @param {number} productId - ID do produto
   * @returns {number} Quantidade do item no carrinho
   */
  getItemQuantity(items, productId) {
    const item = items.find(item => (item.product_id || item.id) === productId);
    return item ? item.quantity : 0;
  }
};

export default cartService;
