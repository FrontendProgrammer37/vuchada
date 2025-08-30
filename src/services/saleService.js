import apiService from './api';

const saleService = {
  /**
   * Lista todas as vendas com paginação
   * @param {Object} params Parâmetros de busca
   * @param {number} [params.skip=0] Número de itens para pular
   * @param {number} [params.limit=100] Número máximo de itens por página
   * @param {string} [params.start_date] Data de início (YYYY-MM-DD)
   * @param {string} [params.end_date] Data de fim (YYYY-MM-DD)
   * @param {string} [params.payment_method] Método de pagamento
   * @param {string} [params.status] Status da venda
   * @returns {Promise<Array>} Lista de vendas
   */
  async listSales({
    skip = 0,
    limit = 100,
    start_date,
    end_date,
    payment_method,
    status
  } = {}) {
    const params = new URLSearchParams();
    params.append('skip', skip);
    params.append('limit', limit);
    
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (payment_method) params.append('payment_method', payment_method);
    if (status) params.append('status', status);

    try {
      const response = await apiService.request(`sales/?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de uma venda específica
   * @param {number} saleId ID da venda
   * @returns {Promise<Object>} Detalhes da venda
   */
  async getSaleDetails(saleId) {
    try {
      return await apiService.request(`sales/${saleId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes da venda:', error);
      throw error;
    }
  },

  /**
   * Cancela uma venda
   * @param {number} saleId ID da venda
   * @param {string} reason Motivo do cancelamento
   * @returns {Promise<Object>} Resultado da operação
   */
  async cancelSale(saleId, reason) {
    try {
      return await apiService.request(`sales/${saleId}/cancel`, {
        method: 'POST',
        body: { reason }
      });
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      throw error;
    }
  },

  /**
   * Gera um relatório de vendas
   * @param {Object} filters Filtros para o relatório
   * @param {string} filters.start_date Data de início (YYYY-MM-DD)
   * @param {string} filters.end_date Data de fim (YYYY-MM-DD)
   * @param {string} [filters.payment_method] Método de pagamento
   * @returns {Promise<Object>} Dados do relatório
   */
  async generateSalesReport(filters) {
    try {
      const params = new URLSearchParams(filters);
      return await apiService.request(`sales/report?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao gerar relatório de vendas:', error);
      throw error;
    }
  }
};

export default saleService;
