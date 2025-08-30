import apiService from './api';

const CART_BASE_URL = '/cart';

const cartService = {
  /**
   * Adiciona um item ao carrinho
   * @param {number} productId - ID do produto
   * @param {number} [quantity=1] - Quantidade do produto
   * @param {Object} [options] - Opções adicionais
   * @param {boolean} [options.isWeightSale=false] - Se é uma venda por peso
   * @param {number} [options.weightInKg] - Peso em kg (obrigatório se isWeightSale=true)
   * @param {number} [options.customPrice] - Preço personalizado (obrigatório se isWeightSale=true)
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async addItem(productId, quantity = 1, { isWeightSale = false, weightInKg, customPrice } = {}, sessionId = 'default') {
    try {
      const body = {
        product_id: productId,
        quantity: quantity
      };

      if (isWeightSale) {
        if (weightInKg === undefined || customPrice === undefined) {
          throw new Error('Para produtos vendidos por peso, é necessário informar o peso e o preço personalizado');
        }
        body.is_weight_sale = true;
        body.weight_in_kg = weightInKg;
        body.custom_price = customPrice;
      }

      const response = await apiService.request(`${CART_BASE_URL}/add?session_id=${sessionId}`, {
        method: 'POST',
        body: body
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
        `${CART_BASE_URL}/remove?session_id=${sessionId}`,
        {
          method: 'POST',
          body: { product_id: productId }
        }
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
      const response = await apiService.request(
        `${CART_BASE_URL}/clear?session_id=${sessionId}`,
        { method: 'POST' }
      );
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw new Error(error.message || 'Erro ao limpar carrinho');
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
        `${CART_BASE_URL}/update?session_id=${sessionId}`,
        {
          method: 'POST',
          body: { 
            product_id: productId,
            quantity: quantity 
          }
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
