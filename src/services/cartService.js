import apiService from './api';

const CART_ENDPOINT = '/cart'; // Removido o '/api/v1' pois já está incluso no baseURL

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
      const response = await apiService.request(`${CART_ENDPOINT}/add?session_id=${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  /**
   * Obtém o carrinho atual
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Dados do carrinho
   */
  async getCart(sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}?session_id=${sessionId}`);
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

  /**
   * Atualiza a quantidade de um item no carrinho
   * @param {number} productId - ID do produto
   * @param {number} quantity - Nova quantidade
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async updateItemQuantity(productId, quantity, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/update?session_id=${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity
        })
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
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
      const response = await apiService.request(`${CART_ENDPOINT}/items/${productId}?session_id=${sessionId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },

  /**
   * Limpa todos os itens do carrinho
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<{success: boolean, message: string}>} Resultado da operação
   */
  async clearCart(sessionId = 'default') {
    try {
      // Tenta usar o endpoint de limpar carrinho se existir
      try {
        const response = await apiService.request(`${CART_ENDPOINT}/clear?session_id=${sessionId}`, {
          method: 'DELETE'
        });
        return { 
          success: true, 
          message: 'Carrinho limpo com sucesso',
          data: response
        };
      } catch (clearError) {
        console.log('Endpoint /clear não disponível, removendo itens individualmente:', clearError);
        
        // Se o endpoint /clear não existir, remove os itens um por um
        const cart = await this.getCart(sessionId);
        if (!cart.items || cart.items.length === 0) {
          return { success: true, message: 'O carrinho já está vazio' };
        }

        // Remove cada item individualmente
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
      }
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw new Error(`Erro ao limpar carrinho: ${error.message}`);
    }
  },

  /**
   * Verifica se um item está no carrinho
   * @param {Array} items - Lista de itens do carrinho
   * @param {number} productId - ID do produto a ser verificado
   * @returns {boolean} Verdadeiro se o item estiver no carrinho
   */
  isInCart(items, productId) {
    return items.some(item => item.product_id === productId);
  },

  /**
   * Obtém a quantidade de um item no carrinho
   * @param {Array} items - Lista de itens do carrinho
   * @param {number} productId - ID do produto
   * @returns {number} Quantidade do item no carrinho
   */
  getItemQuantity(items, productId) {
    const item = items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  }
};

export default cartService;
