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

  // Initialize cart if it doesn't exist
  async initializeCart() {
    if (this.isInitialized) return;
    
    try {
      // Try to get existing cart
      await this.getCart();
    } catch (error) {
      if (error.status === 404) {
        // Cart doesn't exist, create a new one
        await this.makeRequest(CART_ENDPOINT, { method: 'POST' });
      } else {
        console.error('Failed to initialize cart:', error);
        throw error;
      }
    }
    
    this.isInitialized = true;
  }

  // Make API request with retry logic
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    // Ensure we have a valid auth token
    const token = localStorage.getItem('token');
    if (!token && !endpoint.includes('auth')) {
      // Redirect to login if not authenticated
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
        if (retryCount < MAX_RETRIES) {
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
              }, retryCount + 1);
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // Redirect to login on refresh failure
            window.location.href = '/login';
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
        }
        window.location.href = '/login';
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // Handle 404 for cart
      if (error.status === 404 && endpoint === CART_ENDPOINT) {
        // Try to create a new cart if it doesn't exist
        if (options.method === 'GET' && retryCount === 0) {
          try {
            await this.makeRequest(CART_ENDPOINT, { method: 'POST' });
            return this.makeRequest(endpoint, options, retryCount + 1);
          } catch (createError) {
            console.error('Failed to create cart:', createError);
            return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
          }
        }
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
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
