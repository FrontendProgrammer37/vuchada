import apiService from './api';

const CART_ENDPOINT = '/api/v1/cart';

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

      return await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: itemData
      });
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  },

  // Update item quantity
  async updateItemQuantity(itemId, quantity) {
    try {
      return await apiService.request(`${CART_ENDPOINT}/items/${itemId}`, {
        method: 'PUT',
        body: { quantity: parseFloat(quantity) }
      });
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  },

  // Remove item from cart
  async removeItem(itemId) {
    try {
      return await apiService.request(`${CART_ENDPOINT}/items/${itemId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  },

  // Get current cart
  async getCart() {
    try {
      return await apiService.request(CART_ENDPOINT);
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
    try {
      return await apiService.request(CART_ENDPOINT, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Checkout
  async checkout(paymentMethod, amountReceived) {
    try {
      const checkoutData = {
        payment_method: paymentMethod,
        ...(paymentMethod === 'DINHEIRO' && { amount_received: parseFloat(amountReceived) })
      };

      return await apiService.request(`${CART_ENDPOINT}/checkout`, {
        method: 'POST',
        body: checkoutData
      });
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
