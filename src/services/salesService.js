import api from './api';

// Get sales with pagination and filters
export const getSales = async (params = {}) => {
  try {
    const { page = 0, limit = 10, status, start_date, end_date, search } = params;
    const skip = page * limit;
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      skip,
      limit,
      ...(status && { status }),
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
      ...(search && { search })
    });

    const response = await api.get(`/sales?${queryParams}`);
    
    return {
      items: Array.isArray(response.data) ? response.data : [],
      total: response.data?.length || 0,
      page: page,
      limit: limit
    };
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    throw error;
  }
};

// Get sale details
export const getSale = async (saleId) => {
  try {
    const response = await api.get(`/sales/${saleId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error);
    throw error;
  }
};

// Create a new sale
export const createSale = async (saleData) => {
  try {
    const response = await api.post('/sales/', saleData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    throw error;
  }
};

// Cancel a sale
export const cancelSale = async (saleId, reason) => {
  try {
    const response = await api.put(`/sales/${saleId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar venda:', error);
    throw error;
  }
};

// Update sale status
export const updateSaleStatus = async (saleId, status) => {
  try {
    const response = await api.put(`/sales/${saleId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    throw error;
  }
};

// Get sales statistics
export const getSalesStats = async (params = {}) => {
  try {
    const { start_date, end_date } = params;
    const queryParams = new URLSearchParams();
    
    if (start_date) queryParams.append('start_date', start_date);
    if (end_date) queryParams.append('end_date', end_date);
    
    const response = await api.get(`/sales/stats?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de vendas:', error);
    throw error;
  }
};

// Get available payment methods
export const getPaymentMethods = async () => {
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
};

// Export sales to CSV
export const exportSalesToCSV = async (params = {}) => {
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
};
