import apiService from './api';

// Remove /api/v1 prefix since it's already included in the baseURL
const CART_ENDPOINT = 'cart';
const MAX_RETRIES = 2;

// Generate a unique session ID
const generateSessionId = () => {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('sessionId', sessionId);
  return sessionId;
};

class CartService {
  constructor() {
    this.sessionId = localStorage.getItem('sessionId') || generateSessionId();
    this.isInitialized = false;
  }

  // Create a new cart
  async createCart() {
    try {
      // The cart will be created when the first item is added
      // Just mark as initialized and return an empty cart structure
      this.isInitialized = true;
      return { 
        items: [], 
        subtotal: 0, 
        tax_amount: 0, 
        total: 0, 
        itemCount: 0,
        total_quantity: 0 
      };
    } catch (error) {
      console.error('Failed to create cart:', error);
      this.isInitialized = true; // Still mark as initialized to prevent infinite loops
      throw error;
    }
  }

  // Initialize cart if it doesn't exist
  async initializeCart() {
    if (this.isInitialized) {
      return this.getCart();
    }
    
    try {
      const cart = await this.getCart();
      this.isInitialized = true;
      return cart;
    } catch (error) {
      console.error('Error initializing cart:', error);
      // Even if there's an error, mark as initialized to prevent infinite loops
      this.isInitialized = true;
      
      // Return empty cart structure
      return { 
        items: [], 
        subtotal: 0, 
        tax_amount: 0, 
        total: 0, 
        itemCount: 0,
        total_quantity: 0 
      };
    }
  }

  // Make API request with retry logic
  async makeRequest(endpoint, options = {}, isRetry = false) {
    try {
      const response = await apiService.request(
        endpoint,
        {
          method: options.method || 'GET',
          body: options.body,
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId,
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            ...(options.headers || {})
          }
        }
      );
      return response;
    } catch (error) {
      // If we get a 401 and haven't retried yet, try to refresh the token
      if (error.status === 401 && !isRetry) {
        try {
          await apiService.refreshToken();
          // Retry the request with the new token
          return this.makeRequest(endpoint, options, true);
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
      }
      
      // Re-throw the error with more context
      const enhancedError = new Error(error.message || 'Erro na requisição');
      enhancedError.status = error.status;
      enhancedError.response = error.response;
      throw enhancedError;
    }
  }

  // Get current cart
  async getCart() {
    try {
      const response = await this.makeRequest(CART_ENDPOINT);
      
      if (response) {
        return this.normalizeCart(response);
      }
      
      // If no response, return empty cart
      return this.getEmptyCart();
      
    } catch (error) {
      if (error.status === 404) {
        // Return empty cart structure if cart doesn't exist
        return this.getEmptyCart();
      }
      console.error('Error getting cart:', error);
      throw error;
    }
  }
  
  // Get empty cart structure
  getEmptyCart() {
    return {
      items: [],
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      itemCount: 0,
      total_quantity: 0
    };
  }

  // Add item to cart
  async addItem(product, quantity = 1, isWeightSale = false, weightInKg = null, customPrice = null) {
    try {
      // Validate required fields for weight-based sales
      if (isWeightSale) {
        if (!weightInKg || parseFloat(weightInKg) <= 0) {
          throw new Error('Peso inválido para venda por peso. O peso deve ser maior que zero.');
        }
        if (customPrice === null || customPrice === undefined || customPrice === '') {
          throw new Error('Preço personalizado é obrigatório para venda por peso.');
        }
      }

      const requestBody = {
        product_id: product.id,
        quantity: isWeightSale ? 1 : Math.floor(quantity),
        is_weight_sale: isWeightSale
      };

      // Add weight and custom price for weight-based sales
      if (isWeightSale) {
        requestBody.weight_in_kg = parseFloat(weightInKg);
        requestBody.custom_price = parseFloat(customPrice);
      }

      // First try to add the item
      await this.makeRequest(
        `${CART_ENDPOINT}/add`,
        {
          method: 'POST',
          body: requestBody
        }
      );
      
      // Then get the updated cart
      const updatedCart = await this.getCart();
      
      // Ensure all prices are numbers
      updatedCart.items = updatedCart.items.map(item => ({
        ...item,
        price: parseFloat(item.price || 0),
        subtotal: parseFloat(item.subtotal || 0),
        unit_price: parseFloat(item.unit_price || item.price || 0)
      }));
      
      updatedCart.subtotal = parseFloat(updatedCart.subtotal || 0);
      updatedCart.tax_amount = parseFloat(updatedCart.tax_amount || 0);
      updatedCart.total = parseFloat(updatedCart.total || 0);
      
      return updatedCart;
      
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      
      // Handle specific error cases
      if (error.status === 404) {
        // If cart doesn't exist, create one and try again
        await this.createCart();
        return this.addItem(product, quantity, isWeightSale, weightInKg, customPrice);
      }
      
      // For validation errors, show the backend message
      if (error.status === 400 || error.status === 422) {
        const errorMessage = error.response?.detail || error.message || 'Erro ao adicionar item ao carrinho';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  }

  // Update item quantity
  async updateItemQuantity(itemId, quantity) {
    return this.makeRequest(`${CART_ENDPOINT}/items/${itemId}`, {
      method: 'PUT',
      body: { quantity: parseFloat(quantity) }
    });
  }

  // Remove item from cart
  async removeItem(productId) {
    if (!productId) {
      throw new Error('ID do produto é obrigatório para remoção');
    }
    
    try {
      const response = await this.makeRequest(
        `${CART_ENDPOINT}/items/${productId}`, 
        { method: 'DELETE' }
      );
      
      // Return the updated cart from response or fetch a fresh one
      if (response && response.items) {
        return this.normalizeCart(response);
      }
      return await this.getCart();
      
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      
      // If the item is not found, just return the current cart
      if (error.status === 404) {
        console.warn('Item não encontrado no carrinho, atualizando carrinho...');
        return this.getCart();
      }
      
      throw new Error(error.response?.detail || 'Erro ao remover item do carrinho');
    }
  }

  // Clear cart
  async clearCart() {
    return this.makeRequest(`${CART_ENDPOINT}/cart`, {
      method: 'DELETE'
    });
  }

  // Checkout
  async checkout(paymentMethod, amountReceived) {
    const checkoutData = {
      payment_method: paymentMethod,
    };
    
    if (paymentMethod === 'DINHEIRO') {
      checkoutData.amount_received = parseFloat(amountReceived);
    }

    return this.makeRequest(`${CART_ENDPOINT}/checkout`, {
      method: 'POST',
      body: checkoutData
    });
  }

  normalizeCart(cart) {
    cart.items = cart.items.map(item => ({
      ...item,
      price: parseFloat(item.price || 0),
      subtotal: parseFloat(item.subtotal || 0),
      unit_price: parseFloat(item.unit_price || item.price || 0),
      quantity: parseFloat(item.quantity || 0)
    }));
    
    cart.subtotal = parseFloat(cart.subtotal || 0);
    cart.tax_amount = parseFloat(cart.tax_amount || 0);
    cart.total = parseFloat(cart.total || 0);
    cart.itemCount = cart.items.length;
    cart.total_quantity = cart.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    
    return cart;
  }
}

export default new CartService();
