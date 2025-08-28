import apiService from './api';

const REPORT_ENDPOINT = '/api/v1/reports';

const reportService = {
  // Relatório de vendas
  async getSalesReport({ start_date, end_date, group_by = 'day' }) {
    try {
      const query = new URLSearchParams({
        start_date,
        end_date,
        group_by
      });
      
      return await apiService.request(`${REPORT_ENDPOINT}/sales?${query}`);
    } catch (error) {
      console.error('Erro ao obter relatório de vendas:', error);
      throw error;
    }
  },

  // Relatório de estoque
  async getInventoryReport({ low_stock = false } = {}) {
    try {
      const query = new URLSearchParams();
      if (low_stock) query.append('low_stock', 'true');
      
      return await apiService.request(`${REPORT_ENDPOINT}/inventory?${query}`);
    } catch (error) {
      console.error('Erro ao obter relatório de estoque:', error);
      throw error;
    }
  },

  // Relatório de produtos mais vendidos
  async getTopSellingProducts({ start_date, end_date, limit = 10 } = {}) {
    try {
      const query = new URLSearchParams({
        start_date,
        end_date,
        limit
      });
      
      return await apiService.request(`${REPORT_ENDPOINT}/top-products?${query}`);
    } catch (error) {
      console.error('Erro ao obter relatório de produtos mais vendidos:', error);
      throw error;
    }
  },

  // Relatório financeiro
  async getFinancialReport({ start_date, end_date } = {}) {
    try {
      const query = new URLSearchParams({
        start_date,
        end_date
      });
      
      return await apiService.request(`${REPORT_ENDPOINT}/financial?${query}`);
    } catch (error) {
      console.error('Erro ao obter relatório financeiro:', error);
      throw error;
    }
  }
};

export default reportService;
