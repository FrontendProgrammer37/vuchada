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
      const response = await this.makeRequest(CART_ENDPOINT, {
        method: 'POST',
        body: {}
      }, true);
      this.isInitialized = true;
      return response;
    } catch (error) {
      console.error('Failed to create cart:', error);
      throw error;
    }
  }

  // Initialize cart if it doesn't exist
  async initializeCart() {
    if (this.isInitialized) return;
    
    try {
      // First try to get existing cart
      const cart = await this.getCart();
      this.isInitialized = true;
      return cart;
    } catch (error) {
      if (error.status === 404) {
        // Cart doesn't exist, create a new one
        return this.createCart();
      }
      throw error;
    }
  }

  // Make API request with retry logic
  async makeRequest(endpoint, options = {}, isRetry = false) {
    // Ensure we have a valid auth token
    const token = localStorage.getItem('token');
    if (!token && !endpoint.includes('auth')) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    try {
      const response = await apiService.request(endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
          'Authorization': `Bearer ${token}`,
          ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      return response;
    } catch (error) {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        try {
          // Try to refresh token
          const newToken = await apiService.refreshToken();
          if (newToken) {
            // Retry with new token
            return this.makeRequest(endpoint, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`
              }
            }, true);
          }
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          window.location.href = '/login';
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
      }

      // Handle 404 for cart
      if (error.status === 404 && endpoint === CART_ENDPOINT && !isRetry) {
        // Try to create a new cart
        try {
          await this.createCart();
          // Retry the original request
          return this.makeRequest(endpoint, options, true);
        } catch (createError) {
          console.error('Failed to create cart:', createError);
          return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
        }
      }

      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get current cart
  async getCart() {
    return this.makeRequest(CART_ENDPOINT);
  }

  // Add item to cart
  async addItem(product, quantity = 1, isWeightBased = false, customPrice = null) {
    try {
      await this.initializeCart();
      
      const itemData = {
        product_id: product.id,
        quantity: isWeightBased ? parseFloat(quantity) : Math.floor(quantity),
        is_weight_sale: isWeightBased,
      };

      if (customPrice) {
        itemData.custom_price = parseFloat(customPrice);
      }

      return this.makeRequest(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: itemData
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
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
  async removeItem(itemId) {
    return this.makeRequest(`${CART_ENDPOINT}/items/${itemId}`, {
      method: 'DELETE'
    });
  }

  // Clear cart
  async clearCart() {
    return this.makeRequest(`${CART_ENDPOINT}/clear`, {
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
}

export default new CartService();
