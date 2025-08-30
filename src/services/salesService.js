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
      console.error(`Erro ao buscar venda ${saleId}:`, error);
      throw error;
    }
  },

  // Listar todas as vendas (com opções de paginação e filtro)
  async listSales(page = 1, limit = 10, filters = {}) {
    try {
      // Constrói os parâmetros da URL
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      
      // Remove parâmetros undefined
      Array.from(params.entries()).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        }
      });

      const response = await api.request(`sales?${params.toString()}`);
      
      // Se a resposta for um array, retorna diretamente
      if (Array.isArray(response)) {
        return response;
      }
      
      // Se a resposta tiver uma propriedade 'items', retorna ela
      if (response && response.items) {
        return response.items;
      }
      
      // Se não encontrar os itens, retorna um array vazio
      return [];
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      // Retorna um array vazio em caso de erro para não quebrar a UI
      return [];
    }
  },

  // Cancelar uma venda
  async cancelSale(saleId, reason) {
    try {
      const response = await api.post(`/sales/${saleId}/cancel`, { reason });
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
