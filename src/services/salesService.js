import api from './api';

const SALE_ENDPOINT = 'sales';

const salesService = {
  // Create a new sale
  async createSale(saleData) {
    try {
      const response = await api.request(SALE_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          items: saleData.items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          })),
          payment_method: saleData.payment_method,
          amount_received: saleData.amount_received,
          total_amount: saleData.total_amount,
          change: saleData.change || 0
        })
      });
      return response;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // Get sale by ID
  async getSale(id) {
    try {
      return await api.request(`${SALE_ENDPOINT}/${id}`);
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      throw error;
    }
  },

  // Get all sales with optional filters
  async getSales({ page = 1, limit = 10, startDate, endDate } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      return await api.request(`${SALE_ENDPOINT}?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  // Cancel a sale
  async cancelSale(id, reason = '') {
    try {
      return await api.request(`${SALE_ENDPOINT}/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    } catch (error) {
      console.error(`Error cancelling sale ${id}:`, error);
      throw error;
    }
  },

  // Get available payment methods
  async getPaymentMethods() {
    try {
      return [
        { value: 'dinheiro', label: 'Dinheiro' },
        { value: 'mbway', label: 'MB Way' },
        { value: 'multibanco', label: 'Multibanco' },
        { value: 'visa', label: 'Cartão Visa' },
        { value: 'mastercard', label: 'Cartão Mastercard' }
      ];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }
};

export default salesService;
