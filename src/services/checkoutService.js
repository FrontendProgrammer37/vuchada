import apiService from './api';

const CHECKOUT_ENDPOINT = 'cart/checkout';

const checkoutService = {
  /**
   * Processa o checkout de um carrinho de compras
   * @param {Object} checkoutData Dados do checkout
   * @param {string} checkoutData.payment_method Forma de pagamento (DINHEIRO, MPESA, etc.)
   * @param {number} [checkoutData.amount_received] Valor recebido (para pagamento em dinheiro)
   * @param {string} [checkoutData.notes] Observações adicionais
   * @param {number} [checkoutData.customer_id] ID do cliente (opcional)
   * @param {Array} [checkoutData.items] Itens do carrinho
   * @returns {Promise<Object>} Dados da venda processada
   */
  async processCheckout(checkoutData) {
    try {
      // Formata os itens para o formato esperado pelo backend
      const items = (checkoutData.items || []).map(item => ({
        product_id: item.product_id || item.id,
        quantity: item.quantity || 1,
        price: item.price || 0,
        name: item.name || 'Produto sem nome'
      }));

      const payload = {
        payment_method: checkoutData.payment_method || 'DINHEIRO',
        amount_received: parseFloat(checkoutData.amount_received) || 0,
        notes: checkoutData.notes || '',
        customer_id: checkoutData.customer_id || null,
        items: items,
        status: 'completed' // Garante que a venda seja marcada como concluída
      };

      console.log('Enviando dados para checkout:', payload);
      const response = await apiService.post(CHECKOUT_ENDPOINT, payload);
      console.log('Resposta do checkout:', response);
      
      return response;
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      const errorMessage = error.data?.message || error.message || 'Erro ao processar o pagamento';
      throw new Error(errorMessage);
    }
  },

  /**
   * Obtém os detalhes de uma venda pelo ID
   * @param {number} saleId ID da venda
   * @returns {Promise<Object>} Dados da venda
   */
  async getSaleDetails(saleId) {
    try {
      return await apiService.get(`sales/${saleId}`);
    } catch (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
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

      return await apiService.get(`sales/?${params.toString()}`);
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
      return await apiService.post(`sales/${saleId}/cancel`, { reason });
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
      return await apiService.post('payments/generate', paymentData);
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
      return await apiService.get(`payments/${paymentId}/status`);
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw error;
    }
  }
};

export default checkoutService;
