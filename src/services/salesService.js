import api from './api';

const salesService = {
  // Criar uma nova venda
  async createSale(saleData) {
    try {
      const response = await api.post('/sales/', saleData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  // Obter detalhes de uma venda específica
  async getSale(saleId) {
    try {
      const response = await api.get(`/sales/${saleId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter venda:', error);
      throw error;
    }
  },

  // Listar todas as vendas (com opções de paginação e filtro)
  async listSales(page = 1, limit = 10, filters = {}) {
    try {
      const params = {
        page,
        limit,
        ...filters
      };
      
      const response = await api.get('/sales', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  // Cancelar uma venda
  async cancelSale(saleId, reason) {
    try {
      const response = await api.patch(`/sales/${saleId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      throw error;
    }
  },

  // Obter métodos de pagamento disponíveis
  async getPaymentMethods() {
    try {
      const response = await api.get('/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter métodos de pagamento:', error);
      throw error;
    }
  },

  // Get sales with filters and pagination
  async getSales(params = {}) {
    try {
      const response = await api.get('/sales', { params });
      // Ensure the response has the expected structure
      if (response && response.data) {
        return {
          items: Array.isArray(response.data) ? response.data : [],
          page: params.page || 1,
          total_items: response.data?.length || 0,
          total_pages: Math.ceil((response.data?.length || 0) / (params.limit || 10))
        };
      }
      return { items: [], page: 1, total_items: 0, total_pages: 1 };
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      // Return empty result on error to prevent UI breakage
      return { items: [], page: 1, total_items: 0, total_pages: 1 };
    }
  },

  // Get sale details
  async getSaleDetails(saleId) {
    try {
      const response = await api.get(`/sales/${saleId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
      throw error;
    }
  },

  // Export sales to CSV
  async exportSalesToCSV(params = {}) {
    try {
      const response = await api.get('/sales/export/csv', {
        params,
        responseType: 'blob' // Para lidar com a resposta como arquivo
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar vendas para CSV:', error);
      throw error;
    }
  }
};

// Export the service object as default
export default salesService;
