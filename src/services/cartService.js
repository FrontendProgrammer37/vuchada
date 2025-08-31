import apiService from './api';

// Remove /api/v1 prefix since it's already included in the baseURL
const CART_ENDPOINT = 'cart';

// Maximum number of retries for failed requests
const MAX_RETRIES = 2;

const cartService = {
  // Generate a unique ID for cart items
  generateItemId(product, isWeightBased = false, weight = null) {
    if (isWeightBased && weight !== null) {
      return `weight_${product.id}_${Date.now()}`;
    }
    return `product_${product.id}`;
  },

  // Make API request with retry logic
  async makeRequest(endpoint, options = {}, retryCount = 0) {
    try {
      const response = await apiService.request(endpoint, options);
      return response;
    } catch (error) {
      // If unauthorized and we have retries left, try to refresh token and retry
      if (error.status === 401 && retryCount < MAX_RETRIES) {
        try {
          // Try to refresh the token
          await apiService.refreshToken();
          // Retry the request with the new token
          return this.makeRequest(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          console.error('Failed to refresh token:', refreshError);
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
      }
      
      // Handle specific error cases
      if (error.status === 404 && endpoint === CART_ENDPOINT) {
        // Cart not found, return empty cart
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      
      // Re-throw the error if we can't handle it
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  // Add item to cart with duplicate prevention
  async addItem(product, quantity = 1, isWeightBased = false, customPrice = null) {
    const itemData = {
      product_id: product.id,
      quantity: isWeightBased ? parseFloat(quantity) : Math.floor(quantity),
      is_weight_sale: isWeightBased,
      ...(customPrice && { custom_price: parseFloat(customPrice) })
    };

    return this.makeRequest(`${CART_ENDPOINT}/add`, {
      method: 'POST',
      body: itemData
    });
  },

  // Update item quantity
  async updateItemQuantity(itemId, quantity) {
    return this.makeRequest(`${CART_ENDPOINT}/items/${itemId}`, {
      method: 'PUT',
      body: { quantity: parseFloat(quantity) }
    });
  },

  // Remove item from cart
  async removeItem(itemId) {
    return this.makeRequest(`${CART_ENDPOINT}/items/${itemId}`, {
      method: 'DELETE'
    });
  },

  // Get current cart
  async getCart() {
    try {
      const cart = await this.makeRequest(CART_ENDPOINT);
      return {
        items: cart.items || [],
        subtotal: cart.subtotal || 0,
        tax_amount: cart.tax_amount || 0,
        total: cart.total || 0,
        itemCount: cart.itemCount || (cart.items ? cart.items.length : 0)
      };
    } catch (error) {
      // Return empty cart if not found
      if (error.status === 404) {
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // Clear cart
  async clearCart() {
    return this.makeRequest(CART_ENDPOINT, {
      method: 'DELETE'
    });
  },

  // Checkout
  async checkout(paymentMethod, amountReceived) {
    const checkoutData = {
      payment_method: paymentMethod,
      ...(paymentMethod === 'DINHEIRO' && { amount_received: parseFloat(amountReceived) })
    };

    return this.makeRequest(`${CART_ENDPOINT}/checkout`, {
      method: 'POST',
      body: checkoutData
    });
  },

  // Helper methods
  isInCart(items, productId, isWeightBased = false) {
    return items.some(item => 
      item.product_id === productId && 
      item.is_weight_sale === isWeightBased
    );
  },

  getItemQuantity(items, productId, isWeightBased = false) {
    const item = items.find(item => 
      item.product_id === productId && 
      item.is_weight_sale === isWeightBased
    );
    return item ? item.quantity : 0;
  }
};

export default cartService;
