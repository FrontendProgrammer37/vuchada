import api from './api';

const salesService = {
  /**
   * Lista todas as vendas com suporte a paginação
   * @param {number} skip - Número de registros para pular
   * @param {number} limit - Número máximo de registros (máx: 1000)
   * @returns {Promise<Array>} Lista de vendas
   */
  async listSales(skip = 0, limit = 100) {
    try {
      // Garante que o limite não ultrapasse 1000
      const safeLimit = Math.min(limit, 1000);
      const response = await api.request(`/sales/?skip=${skip}&limit=${safeLimit}`);
      return response;
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de uma venda específica
   * @param {number} saleId - ID da venda
   * @returns {Promise<Object>} Detalhes da venda
   */
  async getSale(saleId) {
    try {
      const response = await api.request(`/sales/${saleId}`);
      return response;
    } catch (error) {
      console.error(`Erro ao buscar venda ${saleId}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova venda
   * @param {Object} saleData - Dados da venda
   * @returns {Promise<Object>} Venda criada
   */
  async createSale(saleData) {
    try {
      const response = await api.request('/sales/', {
        method: 'POST',
        body: saleData
      });
      return response;
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      throw error;
    }
  },

  /**
   * Cancela uma venda
   * @param {number} saleId - ID da venda
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise<Object>} Resposta da API
   */
  async cancelSale(saleId, reason) {
    try {
      const response = await api.request(`/sales/${saleId}/cancel`, {
        method: 'POST',
        body: { reason }
      });
      return response;
    } catch (error) {
      console.error(`Erro ao cancelar venda ${saleId}:`, error);
      throw error;
    }
  },

  /**
   * Obtém os métodos de pagamento disponíveis
   * @returns {Promise<Array>} Lista de métodos de pagamento
   */
  async getPaymentMethods() {
    try {
      // Este endpoint pode variar dependendo da API
      const response = await api.request('/payment-methods/');
      return response;
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      // Retorna uma lista padrão em caso de erro
      return [
        { id: 'DINHEIRO', name: 'Dinheiro' },
        { id: 'CARTAO_CREDITO', name: 'Cartão de Crédito' },
        { id: 'CARTAO_DEBITO', name: 'Cartão de Débito' },
        { id: 'TRANSFERENCIA', name: 'Transferência Bancária' },
        { id: 'PIX', name: 'PIX' },
      ];
    }
  }
};

export default salesService;
