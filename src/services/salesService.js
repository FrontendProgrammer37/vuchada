import api from './api';

const salesService = {
  // Criar uma nova venda
  async createSale(saleData) {
    try {
      const response = await api.request('sales/', {
        method: 'POST',
        body: saleData
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  // Obter detalhes de uma venda específica
  async getSale(saleId) {
    try {
      const response = await api.request(`sales/${saleId}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar venda ${saleId}:`, error);
      throw error;
    }
  },

  // Listar todas as vendas (com opções de paginação e filtro)
  async listSales(page = 1, limit = 10, filters = {}) {
    try {
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      }).toString();
      
      const response = await api.request(`sales?${params}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  // Cancelar uma venda
  async cancelSale(saleId, reason) {
    try {
      const response = await api.request(`sales/${saleId}/cancel`, {
        method: 'POST',
        body: { reason }
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao cancelar venda ${saleId}:`, error);
      throw error;
    }
  },

  // Obter métodos de pagamento disponíveis
  getPaymentMethods() {
    return [
      { value: 'DINHEIRO', label: 'Dinheiro' },
      { value: 'MPESA', label: 'M-Pesa' },
      { value: 'EMOLA', label: 'Emola' },
      { value: 'CARTAO_POS', label: 'Cartão P.O.S' },
      { value: 'TRANSFERENCIA', label: 'Transferência' },
      { value: 'MILLENNIUM', label: 'Millennium Bank' },
      { value: 'BCI', label: 'BCI' },
      { value: 'STANDARD_BANK', label: 'Standard Bank' },
      { value: 'ABSA_BANK', label: 'ABSA Bank' },
      { value: 'LETSHEGO', label: 'Letshego' },
      { value: 'MYBUCKS', label: 'MyBucks' }
    ];
  }
};

export default salesService;
