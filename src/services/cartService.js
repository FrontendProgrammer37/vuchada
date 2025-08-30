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
  async addItem(product, quantity = 1, isWeightBased = false) {
    try {
      // Get current cart
      const currentCart = await this.getCart();
      const existingItem = this.findExistingItem(currentCart.items, product, isWeightBased);

      if (existingItem && !isWeightBased) {
        // Update quantity for existing non-weight-based item
        return this.updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
      }

      // Create new item
      const itemId = this.generateItemId(product, isWeightBased, quantity);
      const newItem = {
        id: itemId,
        product_id: product.id,
        name: product.name,
        quantity: isWeightBased ? parseFloat(quantity) : Math.floor(quantity),
        unit_price: product.sale_price,
        is_weight_based: isWeightBased,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          sale_price: product.sale_price,
          current_stock: product.current_stock,
          track_inventory: product.track_inventory,
          is_weight_based: product.is_weight_based
        }
      };

      // Add to cart
      const response = await apiService.request(`${CART_ENDPOINT}/add`, {
        method: 'POST',
        body: newItem
      });

      return response;
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      throw error;
    }
  },

  // Update existing methods to work with the new ID system
  async updateItemQuantity(itemId, quantity) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/update`, {
        method: 'PUT',
        body: {
          item_id: itemId,
          quantity: quantity
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      throw error;
    }
  },

  // Keep existing methods but ensure they work with the new ID system
  async removeItem(itemId) {
    try {
      await apiService.request(`${CART_ENDPOINT}/remove`, {
        method: 'DELETE',
        body: { item_id: itemId }
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      throw error;
    }
  },

  // Existing methods remain the same
  async getCart() {
    try {
      const response = await apiService.request(CART_ENDPOINT);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        return { items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 };
      }
      console.error('Erro ao buscar carrinho:', error);
      throw error;
    }
  },

  async clearCart() {
    try {
      await apiService.request(CART_ENDPOINT, { method: 'DELETE' });
      return true;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      throw error;
    }
  },

  // Helper methods
  isInCart(items, productId, isWeightBased = false) {
    if (isWeightBased) return false; // Weight-based items are always unique
    return items.some(item => 
      item.product_id === productId && 
      !item.is_weight_based
    );
  },

  getItemQuantity(items, productId, isWeightBased = false) {
    const item = items.find(item => 
      item.product_id === productId && 
      item.is_weight_based === isWeightBased
    );
    return item ? item.quantity : 0;
  },

  async checkout(paymentMethod, amountReceived) {
    try {
      const response = await apiService.request(`${CART_ENDPOINT}/checkout`, {
        method: 'POST',
        body: {
          payment_method: paymentMethod,
          amount_received: parseFloat(amountReceived || 0)
        }
      });
      return response;
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      throw error;
    }
  }
};

export default cartService;
