import api from './api';

const salesService = {
  // Get sales with pagination
  async getSales(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const response = await api.get(`/sales?skip=${skip}&limit=${limit}`);
      
      // Transform the API response to match the expected format
      return {
        items: Array.isArray(response) ? response : [],
        page: page,
        total_items: response?.length || 0,
        total_pages: Math.ceil((response?.length || 0) / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return { items: [], page: 1, total_items: 0, total_pages: 1 };
    }
  },

  // Get sale details
  async getSale(saleId) {
    try {
      const response = await api.get(`/sales/${saleId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
      throw error;
    }
  },

  // Create a new sale
  async createSale(saleData) {
    try {
      const response = await api.post('/sales/', saleData);
      return response;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  // Cancel a sale
  async cancelSale(saleId, reason) {
    try {
      const response = await api.patch(`/sales/${saleId}/cancel`, { reason });
      return response;
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      throw error;
    }
  },

  // Get available payment methods
  async getPaymentMethods() {
    return [
      'DINHEIRO',
      'MPESA',
      'EMOLA',
      'CARTAO_POS',
      'TRANSFERENCIA',
      'MILLENNIUM',
      'BCI',
      'STANDARD_BANK',
      'ABSA_BANK',
      'LETSHEGO',
      'MYBUCKS'
    ];
  },

  // Export sales to CSV
  async exportSalesToCSV(params = {}) {
    try {
      const response = await api.get('/sales/export/csv', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Erro ao exportar vendas para CSV:', error);
      throw error;
    }
  }
};

export default salesService;
