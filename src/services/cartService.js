import apiService from './api';

const CART_ENDPOINT = 'cart';

const cartService = {
  // Generate a unique ID for cart items
  generateItemId(product, isWeightBased = false, weight = null) {
    if (isWeightBased && weight !== null) {
      return `weight_${product.id}_${Date.now()}`;
    }
    return `product_${product.id}`;
  },

  // Check if an item already exists in the cart
  findExistingItem(items, product, isWeightBased = false) {
    if (isWeightBased) {
      // For weight-based items, always treat as unique
      return null;
    }
    return items.find(item => 
      item.id === `product_${product.id}` && 
      !item.is_weight_based
    );
  },

  // Add item to cart with duplicate prevention
  async addItem(product, quantity = 1, isWeightBased = false, customPrice = null) {
    try {
      const itemData = {
        product_id: product.id,
        quantity: isWeightBased ? parseFloat(quantity) : Math.floor(quantity),
        is_weight_sale: isWeightBased,
        ...(customPrice && { custom_price: parseFloat(customPrice) })
      };

      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: JSON.stringify(itemData)
      });
      
      return response;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },

  // Update item quantity
  async updateItemQuantity(itemId, quantity) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parseFloat(quantity) })
      });
      return response;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  },

  // Remove item from cart
  async removeItem(itemId) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/items/${itemId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  // Get current cart
  async getCart() {
    try {
      const response = await apiService.request(CART_ENDPOINT);
      return response;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // Clear cart
  async clearCart() {
    try {
      const response = await apiService.request(CART_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' })
      });
      return response;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Checkout
  async checkout(paymentMethod, amountReceived) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentMethod,
          amount_received: parseFloat(amountReceived)
        })
      });
      return response;
    } catch (error) {
      console.error('Error during checkout:', error);
      throw error;
    }
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
