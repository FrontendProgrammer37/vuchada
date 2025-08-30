import apiService from './api';

const CHECKOUT_ENDPOINT = '/api/v1/cart';

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
      const response = await apiService.request(`${CHECKOUT_ENDPOINT}/add`, {
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
   * Obtém os itens do carrinho
   * @param {string} [sessionId='default'] - ID da sessão do carrinho
   * @returns {Promise<Object>} Itens do carrinho
   */
  async getCart(sessionId = 'default') {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}?session_id=${sessionId}`);
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
   * @returns {Promise<Object>} Dados da venda processada
   */
  async processCheckout({ payment_method, customer_id = null, notes = '' }, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CHECKOUT_ENDPOINT}/checkout?session_id=${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method,
          customer_id,
          notes
        })
      });
      
      return response;
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
      return await apiService.request(`${CHECKOUT_ENDPOINT}/sales/${saleId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes da venda:', error);
      throw error;
    }
  },

  /**
   * Métodos de pagamento disponíveis
   */
  paymentMethods: {
    DINHEIRO: 'DINHEIRO',
    MPESA: 'MPESA',
    EMOLA: 'EMOLA',
    CARTAO_POS: 'CARTAO_POS',
    TRANSFERENCIA: 'TRANSFERENCIA',
    MILLENNIUM: 'MILLENNIUM',
    BCI: 'BCI',
    STANDARD_BANK: 'STANDARD_BANK',
    ABSA_BANK: 'ABSA_BANK',
    LETSHEGO: 'LETSHEGO',
    MYBUCKS: 'MYBUCKS'
  }
};

export default checkoutService;
