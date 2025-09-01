import apiService from './api';

// Base endpoint for cart operations
const CART_ENDPOINT = '/cart';
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
    this.getCart = this.getCart.bind(this);
    this.addItem = this.addItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.updateItemQuantity = this.updateItemQuantity.bind(this);
    this.clearCart = this.clearCart.bind(this);
    this.checkout = this.checkout.bind(this);
  }

  // Endpoints específicos
  get ENDPOINTS() {
    return {
      CART: CART_ENDPOINT,
      ADD_ITEM: `${CART_ENDPOINT}/add`,
      REMOVE_ITEM: (productId) => `${CART_ENDPOINT}/items/${productId}`,
      CLEAR_CART: `${CART_ENDPOINT}/clear`,
      CHECKOUT: `${CART_ENDPOINT}/checkout`,
      GET_CART: `${CART_ENDPOINT}`
    };
  }

  // Create a new cart
  async createCart() {
    try {
      console.log('Creating new cart...');
      // Tenta adicionar um item vazio para forçar a criação do carrinho
      await this.makeRequest(
        this.ENDPOINTS.ADD_ITEM,
        {
          method: 'POST',
          body: {
            product_id: 0, // ID inválido, mas forçará a criação do carrinho
            quantity: 0
          }
        }
      );
      
      // Depois de criar, busca o carrinho vazio
      const cart = await this.makeRequest(this.ENDPOINTS.GET_CART);
      this.isInitialized = true;
      return this.normalizeCart(cart);
      
    } catch (error) {
      console.error('Failed to create cart:', error);
      // Se der erro, retorna um carrinho vazio localmente
      this.isInitialized = true;
      return this.getEmptyCart();
    }
  }

  // Initialize cart if it doesn't exist
  async initializeCart() {
    if (this.isInitialized) {
      return this.getCart();
    }
    
    try {
      // First try to get the existing cart
      try {
        const cart = await this.getCart();
        this.isInitialized = true;
        return cart;
      } catch (error) {
        console.log('Cart not found, creating a new one...');
        // If cart doesn't exist, create a new one
        const newCart = await this.createCart();
        this.isInitialized = true;
        return newCart;
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
      // Even if there's an error, mark as initialized to prevent infinite loops
      this.isInitialized = true;
      
      // Return empty cart structure
      return this.getEmptyCart();
    }
  }

  // Make API request with retry logic
  async makeRequest(endpoint, options = {}, isRetry = false) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Session-ID': this.sessionId,
        ...(options.headers || {})
      };

      // Add authorization header if token exists
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('Making request:', {
        endpoint,
        method: options.method || 'GET',
        headers,
        body: options.body
      });

      const response = await apiService.request(
        endpoint,
        {
          method: options.method || 'GET',
          body: options.body,
          headers
        }
      );

      console.log('API Response:', response);
      return response;
      
    } catch (error) {
      console.error('Request failed:', error);
      
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

  // Get cart from server
  async getCart() {
    try {
      console.log('Getting cart...');
      const response = await this.makeRequest(this.ENDPOINTS.GET_CART, { method: 'GET' });
      
      // If we get here, the request was successful
      if (response) {
        return this.normalizeCart(response);
      }
      
      // If no response, return empty cart
      return this.getEmptyCart();
      
    } catch (error) {
      // If cart doesn't exist (404), return empty cart
      if (error.status === 404) {
        console.log('Cart not found, returning empty cart');
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
      // Log incoming product data
      console.log('CartService.addItem - Input:', {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          codigo: product.codigo
        },
        quantity,
        isWeightSale,
        weightInKg,
        customPrice
      });

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
        is_weight_sale: isWeightSale,
        sku: product.codigo || product.sku || null,  // Try both codigo and sku fields
        product_name: product.name || product.product_name || null
      };

      console.log('CartService.addItem - Request body:', requestBody);

      // Add weight and custom price for weight-based sales
      if (isWeightSale) {
        requestBody.weight_in_kg = parseFloat(weightInKg);
        requestBody.custom_price = parseFloat(customPrice);
      }

      console.log('Sending to backend:', { endpoint: this.ENDPOINTS.ADD_ITEM, body: requestBody });

      const response = await this.makeRequest(
        this.ENDPOINTS.ADD_ITEM,
        {
          method: 'POST',
          body: requestBody
        }
      );

      console.log('Backend response:', response);
      
      // Se a resposta já contiver os itens atualizados, retorna formatado
      if (response && Array.isArray(response.items)) {
        return {
          items: response.items,
          subtotal: response.subtotal || 0,
          total: response.total || 0,
          item_count: response.items.length
        };
      }
      
      // Caso contrário, busca o carrinho atualizado
      return this.getCart();
      
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

  // Update item quantity in cart
  async updateItemQuantity(productId, newQuantity) {
    if (!productId) {
      throw new Error('ID do produto é obrigatório');
    }

    if (!newQuantity || newQuantity < 1) {
      throw new Error('Quantidade deve ser maior que zero');
    }

    try {
      console.log(`Setting quantity for product ${productId} to ${newQuantity}`);
      
      // Get current cart to check stock
      const currentCart = await this.getCart();
      const cartItem = currentCart.items?.find(item => 
        (item.product_id || item.id) === productId
      );

      if (!cartItem) {
        throw new Error('Item não encontrado no carrinho');
      }

      // Check if we have stock information
      if (cartItem.estoque_disponivel !== undefined && newQuantity > cartItem.estoque_disponivel) {
        throw new Error(`Estoque insuficiente. Disponível: ${cartItem.estoque_disponivel}, Solicitado: ${newQuantity}`);
      }

      // First remove the item completely
      await this.removeItem(productId);
      
      // Then add it back with the new quantity
      const response = await this.makeRequest(
        this.ENDPOINTS.ADD_ITEM,
        {
          method: 'POST',
          body: {
            product_id: productId,
            quantity: newQuantity
          }
        }
      );

      console.log('Update quantity response:', response);
      return response;
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  // Remove item from cart
  async removeItem(productId) {
    if (!productId) {
      throw new Error('ID do produto é obrigatório para remoção');
    }
    
    try {
      console.log(`Removing item ${productId} from cart`);
      
      // Usando o endpoint correto para remoção
      const response = await this.makeRequest(
        `${this.ENDPOINTS.CART}/items/${productId}`,
        { 
          method: 'DELETE',
          body: null // Garante que não há corpo na requisição DELETE
        }
      );
      
      console.log('Remove item response:', response);
      
      // Se a resposta já contém os itens atualizados, retorna diretamente
      if (response && Array.isArray(response.items)) {
        return {
          items: response.items,
          subtotal: response.subtotal || 0,
          total: response.total || 0,
          item_count: response.items.length
        };
      }
      
      // Caso contrário, busca o carrinho atualizado
      return this.getCart();
      
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
      
      // Se o item não for encontrado, retorna o carrinho atual
      if (error.status === 404) {
        console.warn('Item não encontrado no carrinho, atualizando carrinho...');
        return this.getCart();
      }
      
      throw new Error(error.response?.detail || 'Erro ao remover item do carrinho');
    }
  }

  // Clear the entire cart
  async clearCart() {
    try {
      console.log('Clearing cart...');
      
      // Clear cart on the server
      await this.makeRequest(this.ENDPOINTS.CART, {
        method: 'DELETE'
      });
      
      // Reset local state
      this.resetLocalCart();
      
      // Return empty cart structure
      return {
        items: [],
        subtotal: 0,
        total: 0,
        item_count: 0,
        tax_amount: 0
      };
      
    } catch (error) {
      console.error('Error clearing cart:', error);
      
      // Even if server fails, reset local state
      this.resetLocalCart();
      
      // If it's a 404, the cart was already empty
      if (error.status === 404) {
        return {
          items: [],
          subtotal: 0,
          total: 0,
          item_count: 0,
          tax_amount: 0
        };
      }
      
      throw new Error(error.response?.detail || 'Falha ao limpar o carrinho');
    }
  }

  // Reset local cart and generate new session ID
  resetLocalCart() {
    console.log('Resetting local cart and generating new session ID');
    
    // Gera um novo sessionId
    this.sessionId = generateSessionId();
    
    // Limpa qualquer dado local relacionado ao carrinho
    localStorage.removeItem('cart');
    
    console.log(`New session ID: ${this.sessionId}`);
    
    return {
      items: [],
      subtotal: 0,
      total: 0,
      item_count: 0
    };
  }

  // Checkout
  async checkout(paymentData) {
    const { 
      paymentMethod, 
      amountReceived = 0, 
      customerId = null, 
      discount = 0,
      notes = ''
    } = paymentData;

    // Validação básica
    if (!paymentMethod) {
      throw new Error('Método de pagamento é obrigatório');
    }

    if (paymentMethod === 'DINHEIRO' && !amountReceived) {
      throw new Error('Valor recebido é obrigatório para pagamento em dinheiro');
    }

    const checkoutData = {
      payment_method: paymentMethod,
      amount_received: parseFloat(amountReceived) || 0,
      customer_id: customerId,
      discount: parseFloat(discount) || 0,
      notes: notes,
      change_for: 0 // Será calculado no backend
    };

    try {
      console.log('Enviando dados de checkout:', checkoutData);
      
      const response = await this.makeRequest(
        `${this.ENDPOINTS.CHECKOUT}`,
        {
          method: 'POST',
          body: checkoutData
        }
      );

      console.log('Resposta do checkout:', response);
      
      // Limpa o carrinho após o checkout bem-sucedido
      await this.clearCart();
      
      // Retorna os dados da venda
      return {
        success: true,
        sale_number: response.sale_number || '',
        total_amount: response.total_amount || 0,
        change: response.change || 0,
        sale_id: response.sale_id || null,
        timestamp: response.timestamp || new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      
      // Para erros de validação, mostra a mensagem do backend
      if (error.status === 400 || error.status === 422) {
        const errorMessage = error.response?.detail || error.message || 'Erro ao processar o pagamento';
        throw new Error(errorMessage);
      }
      
      // Para erros de autenticação, limpa o carrinho e força novo login
      if (error.status === 401) {
        await this.clearCart();
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      throw error;
    }
  }

  // Normalize cart data to ensure consistent structure
  normalizeCart(cart) {
    if (!cart) {
      return this.getEmptyCart();
    }

    // Ensure items is an array
    const items = Array.isArray(cart.items) ? cart.items : [];
    
    // Normalize each item
    const normalizedItems = items.map(item => ({
      ...item,
      // Ensure required fields exist
      id: item.id || item.product_id,
      product_id: item.product_id || item.id,
      name: item.name || item.product_name || item.nome,
      sku: item.sku || item.codigo || null,
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price || item.price) || 0,
      total_price: parseFloat(item.total_price || (item.quantity * (item.unit_price || item.price))) || 0,
      is_weight_sale: Boolean(item.is_weight_sale)
    }));

    // Calculate totals if not provided
    const subtotal = cart.subtotal !== undefined ? parseFloat(cart.subtotal) : 
      normalizedItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
      
    const total = cart.total !== undefined ? parseFloat(cart.total) : subtotal;
    
    return {
      items: normalizedItems,
      subtotal,
      tax_amount: parseFloat(cart.tax_amount || 0),
      total,
      itemCount: normalizedItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0),
      total_quantity: normalizedItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)
    };
  }
}

export default new CartService();
