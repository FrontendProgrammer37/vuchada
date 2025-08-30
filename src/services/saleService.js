import apiService from './api';

const SALE_ENDPOINT = '/api/v1/sales';

const saleService = {
  // Listar vendas com filtros
  async listSales({ start_date, end_date, status, page = 1, size = 10 } = {}) {
    try {
      const query = new URLSearchParams({ start_date, end_date, page, size });
      if (status) query.append('status', status);
      return await apiService.request(`${SALE_ENDPOINT}/?${query}`);
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  // Obter detalhes de uma venda
  async getSaleDetails(saleId) {
    try {
      return await apiService.request(`${SALE_ENDPOINT}/${saleId}`);
    } catch (error) {
      console.error('Erro ao obter venda:', error);
      throw error;
    }
  },

  // Criar nova venda
  async createSale(saleData) {
    try {
      return await apiService.request(SALE_ENDPOINT, {
        method: 'POST',
        body: {
          customer_id: saleData.customer_id || null,
          items: saleData.items,
          payment_method: saleData.payment_method,
          discount_amount: saleData.discount_amount || 0,
          notes: saleData.notes || ''
        }
      });
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  // Cancelar venda
  async cancelSale(saleId, reason = '') {
    try {
      return await apiService.request(`${SALE_ENDPOINT}/${saleId}/cancel`, {
        method: 'POST',
        body: { reason }
      });
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      throw error;
    }
  }
};

export default saleService;
