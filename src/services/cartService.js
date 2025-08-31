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

  // Create a new cart by adding an item
  async createCart(product = null, quantity = 1, isWeightSale = false, weightInKg = 0, customPrice = null) {
    try {
      if (product) {
        const response = await this.addItem(product, quantity, isWeightSale, weightInKg, customPrice);
        this.isInitialized = true;
        return response;
      } else {
        // Just mark as initialized without adding any items
        this.isInitialized = true;
        return { items: [], subtotal: 0, tax_amount: 0, total: 0 };
      }
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
        // Cart doesn't exist, create an empty one
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
      if (error.status === 404 && endpoint === CART_ENDPOINT) {
        throw error; // Let the calling method handle 404
      }

      // For other errors, log and rethrow
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get current cart
  async getCart() {
    return this.makeRequest(CART_ENDPOINT);
  }

  // Add item to cart
  async addItem(product, quantity = 1, isWeightSale = false, weightInKg = 0, customPrice = null) {
    try {
      // Validate weight for weight-based sales
      if (isWeightSale && (!weightInKg || parseFloat(weightInKg) <= 0)) {
        throw new Error('Peso inválido para venda por peso. O peso deve ser maior que zero.');
      }

      const requestBody = {
        product_id: product.id,
        quantity: isWeightSale ? 1 : Math.floor(quantity),
        is_weight_sale: isWeightSale,
        weight_in_kg: isWeightSale ? parseFloat(weightInKg) : 0
      };

      // Only include custom_price if provided and valid
      if (customPrice !== null && !isNaN(parseFloat(customPrice))) {
        requestBody.custom_price = parseFloat(customPrice);
      }

      const response = await this.makeRequest(
        `${CART_ENDPOINT}/add`,
        {
          method: 'POST',
          body: requestBody
        }
      );
      
      // Refresh cart data
      const updatedCart = await this.getCart();
      return updatedCart;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
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
