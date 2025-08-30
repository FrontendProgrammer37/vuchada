import apiService from './api';

const CHECKOUT_ENDPOINT = '/api/v1/checkout';

const checkoutService = {
  /**
   * Processa o checkout de um carrinho de compras
   * @param {Object} checkoutData Dados do checkout
   * @param {string} checkoutData.payment_method Forma de pagamento (dinheiro, cartao_credito, cartao_debito, pix)
   * @param {number} [checkoutData.amount_received] Valor recebido (para pagamento em dinheiro)
   * @param {string} [checkoutData.notes] Observações adicionais
   * @param {number} [checkoutData.customer_id] ID do cliente (opcional)
   * @returns {Promise<Object>} Dados da venda processada
   */
  async processCheckout(checkoutData) {
    try {
      const response = await apiService.request(CHECKOUT_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: checkoutData.payment_method,
          amount_received: checkoutData.amount_received || 0,
          notes: checkoutData.notes || '',
          customer_id: checkoutData.customer_id || null
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
   * Lista as vendas com filtros opcionais
   * @param {Object} filters Filtros de busca
   * @param {string} [filters.start_date] Data de início (YYYY-MM-DD)
   * @param {string} [filters.end_date] Data de fim (YYYY-MM-DD)
   * @param {string} [filters.payment_method] Forma de pagamento
   * @param {number} [filters.customer_id] ID do cliente
   * @param {number} [page=1] Número da página
   * @param {number} [limit=10] Itens por página
   * @returns {Promise<Object>} Lista de vendas e metadados de paginação
   */
  async listSales(filters = {}, page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      return await apiService.request(`${CHECKOUT_ENDPOINT}/sales?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  /**
   * Cancela uma venda
   * @param {number} saleId ID da venda a ser cancelada
   * @param {string} reason Motivo do cancelamento
   * @returns {Promise<Object>} Resultado da operação
   */
  async cancelSale(saleId, reason) {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}/sales/${saleId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      throw error;
    }
  },

  /**
   * Gera um link de pagamento (para PIX, boleto, etc.)
   * @param {Object} paymentData Dados do pagamento
   * @param {number} paymentData.amount Valor do pagamento
   * @param {string} paymentData.payment_method Método de pagamento (pix, boleto, etc.)
   * @param {string} [paymentData.description] Descrição do pagamento
   * @returns {Promise<Object>} Dados do link de pagamento
   */
  async generatePaymentLink(paymentData) {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}/payment-link`, {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          description: paymentData.description || ''
        })
      });
    } catch (error) {
      console.error('Erro ao gerar link de pagamento:', error);
      throw error;
    }
  },

  /**
   * Obtém o status de um pagamento
   * @param {string} paymentId ID do pagamento
   * @returns {Promise<Object>} Status do pagamento
   */
  async getPaymentStatus(paymentId) {
    try {
      return await apiService.request(`${CHECKOUT_ENDPOINT}/payment/${paymentId}/status`);
    } catch (error) {
      console.error('Erro ao obter status do pagamento:', error);
      throw error;
    }
  }
};

export default checkoutService;
