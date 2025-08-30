import apiService from './api';

const CART_ENDPOINT = '/cart';

// Opções de pagamento disponíveis
export const PAYMENT_METHODS = {
  CASH: 'DINHEIRO',
  MPESA: 'MPESA',
  EMOLA: 'EMOLA',
  CREDIT_CARD: 'CARTAO_POS',
  BANK_TRANSFER: 'TRANSFERENCIA',
  MILLENNIUM: 'MILLENNIUM',
  BCI: 'BCI',
  STANDARD_BANK: 'STANDARD_BANK',
  ABSA_BANK: 'ABSA_BANK',
  LETSHEGO: 'LETSHEGO',
  MYBUCKS: 'MYBUCKS'
};

const cartService = {
  // Adicionar item ao carrinho
  async addItem(productId, quantity = 1) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: {
          product_id: productId,
          quantity: quantity
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  // Obter carrinho atual
  async getCart(sessionId = 'default') {
    try {
      const response = await apiService.request(CART_ENDPOINT, {
        method: 'GET',
        params: { session_id: sessionId }
      });
      return response;
    } catch (error) {
      // Se o carrinho não existir, retorna um carrinho vazio
      if (error.response?.status === 404) {
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      console.error('Erro ao buscar carrinho:', error);
      throw error;
    }
  },

  // Atualizar quantidade de um item
  async updateItemQuantity(productId, quantity, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/update`, {
        method: 'PUT',
        body: {
          product_id: productId,
          quantity: quantity
        },
        params: { session_id: sessionId }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
    }
  },

  // Remover item do carrinho
  async removeItem(productId, sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/remove`, {
        method: 'DELETE',
        body: { product_id: productId },
        params: { session_id: sessionId }
      });
      return response;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },

  // Limpar carrinho
  async clearCart(sessionId = 'default') {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/clear`, {
        method: 'DELETE',
        params: { session_id: sessionId }
      });
      return response;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    }
  },

  // Verificar se um item está no carrinho
  isInCart(items, productId) {
    return items.some(item => item.product_id === productId);
  },

  // Obter quantidade de um item no carrinho
  getItemQuantity(items, productId) {
    const item = items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  },

  // Finalizar compra/checkout
  async checkout(paymentMethod, customerId = null, notes = '', sessionId = 'default') {
    try {
      if (!paymentMethod) {
        throw new Error('Método de pagamento é obrigatório');
      }

      // Verifica se o método de pagamento é válido
      if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
        throw new Error('Método de pagamento inválido');
      }

      const response = await apiService.request(
        `${CART_ENDPOINT}/checkout`,
        {
          method: 'POST',
          body: {
            payment_method: paymentMethod,
            customer_id: customerId,
            notes: notes
          },
          params: { session_id: sessionId }
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      
      // Tratamento de erros específicos
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          throw new Error(data.detail || 'Dados inválidos para finalizar a compra');
        } else if (status === 401) {
          throw new Error('Não autorizado. Por favor, faça login novamente.');
        } else if (status === 404) {
          throw new Error('Carrinho não encontrado ou vazio');
        } else if (status >= 500) {
          throw new Error('Erro no servidor ao processar o pagamento');
        }
      }
      
      throw error;
    }
  },

  // Obter histórico de vendas
  async getSalesHistory(page = 1, limit = 10) {
    try {
      const response = await apiService.request(`/api/v1/sales?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
      throw error;
    }
  },

  // Obter detalhes de uma venda específica
  async getSaleDetails(saleId) {
    try {
      const response = await apiService.request(`/api/v1/sales/${saleId}`);
      return response;
    } catch (error) {
      console.error('Erro ao buscar detalhes da venda:', error);
      throw error;
    }
  }
};

export default cartService;
