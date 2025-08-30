import apiService from './api';

const CHECKOUT_ENDPOINT = '/cart'; 

const checkoutService = {
  /**
   * Adiciona um item ao carrinho
   * @param {number} productId - ID do produto
   * @param {number} quantity - Quantidade do produto
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API
   */
  async addToCart(productId, quantity, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CHECKOUT_ENDPOINT}/add?session_id=${sessionId}`, {
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

  /**
   * Obtém os itens do carrinho
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Itens do carrinho
   */
  async getCart(sessionId = 'default') {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}?session_id=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Erro ao obter carrinho:', error);
      throw error;
    }
  },

  /**
   * Processa o checkout de um carrinho de compras
   * @param {Object} checkoutData Dados do checkout
   * @param {string} checkoutData.payment_method Forma de pagamento (DINHEIRO, MPESA, CARTAO_POS, etc.)
   * @param {number} [checkoutData.customer_id] ID do cliente (opcional)
   * @param {string} [checkoutData.notes] Observações adicionais
   * @param {string} [sessionId='default'] ID da sessão do carrinho
   * @returns {Promise<Object>} Resposta da API com os dados da venda
   */
  async processCheckout(checkoutData, sessionId = 'default') {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}/checkout?session_id=${sessionId}`, {
        method: 'POST',
        body: checkoutData
      });
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de uma venda pelo ID
   * @param {number} saleId ID da venda
   * @returns {Promise<Object>} Dados da venda
   */
  async getSaleDetails(saleId) {
    try {
      return await apiService.request(`/sales/${saleId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes da venda:', error);
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
      return await apiService.request(`${CHECKOUT_ENDPOINT}/items/${productId}?session_id=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },

  /**
   * Métodos de pagamento disponíveis
   */
  paymentMethods: {
    CASH: 'DINHEIRO',
    MPESA: 'MPESA',
    POS_CARD: 'CARTAO_POS',
    TRANSFER: 'TRANSFERENCIA',
    CHECK: 'CHEQUE',
    MOBILE_MONEY: 'DINHEIRO_MOVEL'
  }
};

export default checkoutService;
