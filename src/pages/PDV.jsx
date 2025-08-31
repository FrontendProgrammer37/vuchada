import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Scale, CreditCard, DollarSign } from 'lucide-react';
import apiService from '../services/api';
import WeightInputModal from '../components/WeightInputModal';

const PAYMENT_METHODS = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'MPESA', label: 'M-Pesa' },
  { value: 'EMOLA', label: 'E-Mola' },
  { value: 'CARTAO_POS', label: 'Cartão POS' },
  { value: 'TRANSFERENCIA', label: 'Transferência Bancária' },
  { value: 'MILLENNIUM', label: 'Millennium BIM' },
  { value: 'BCI', label: 'BCI' },
  { value: 'STANDARD_BANK', label: 'Standard Bank' },
  { value: 'ABSA_BANK', label: 'ABSA Bank' },
  { value: 'LETSHEGO', label: 'Letshego' },
  { value: 'MYBUCKS', label: 'MyBucks' }
];

const PDV = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weightInput, setWeightInput] = useState({
    isOpen: false,
    product: null,
    isEditing: false,
    cartItemId: null
  });
  const [processing, setProcessing] = useState(false);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiService.getProducts({ limit: 1000 }); // Get all products
        setProducts(data);
      } catch (err) {
        setError('Erro ao carregar produtos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add item to cart with inventory control
  const addToCart = (product) => {
    if (product.venda_por_peso) {
      const maxWeight = product.track_inventory ? product.current_stock : null;
      setWeightInput({
        isOpen: true,
        product: { ...product, maxWeight },
        initialWeight: '0.100',
        isEditing: false
      });
      return;
    }

    // Regular product with inventory control
    if (product.track_inventory && product.current_stock <= 0) {
      setError(`Produto ${product.name} sem estoque disponível`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.id === product.id && !item.is_weight_based
      );
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        if (product.track_inventory && newQuantity > product.current_stock) {
          setError(`Quantidade solicitada excede o estoque disponível de ${product.current_stock} unidades`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id && !item.is_weight_based
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      if (product.track_inventory && product.current_stock < 1) {
        setError(`Produto ${product.name} sem estoque disponível`);
        return prevCart;
      }
      
      return [...prevCart, { ...product, quantity: 1, is_weight_based: false }];
    });
  };

  // Update quantity with inventory control
  const updateQuantity = (productId, newQuantity, isWeightBased = false) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId);
      if (!item) return prevCart;

      // Skip inventory check for weight-based items (handled in modal)
      if (!isWeightBased && item.track_inventory && newQuantity > item.current_stock) {
        setError(`Quantidade solicitada excede o estoque disponível de ${item.current_stock} unidades`);
        return prevCart;
      }

      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  // Handle weight confirmation from modal
  const handleWeightConfirm = (weight) => {
    const { product, isEditing, cartItemId } = weightInput;
    
    if (isEditing) {
      updateQuantity(cartItemId, weight, true);
    } else {
      // For new weight-based items, check inventory if tracking is enabled
      if (product.track_inventory && weight > product.current_stock) {
        setError(`Peso solicitado (${formatWeight(weight)} kg) excede o estoque disponível (${formatWeight(product.current_stock)} kg)`);
        return;
      }
      
      setCart(prevCart => [
        ...prevCart,
        {
          ...product,
          id: `${product.id}-${Date.now()}`,
          quantity: weight,
          is_weight_based: true,
          // Update current_stock to reflect the remaining inventory
          current_stock: product.track_inventory 
            ? product.current_stock - weight 
            : product.current_stock
        }
      ]);
    }
    
    setWeightInput({ isOpen: false, product: null, isEditing: false, cartItemId: null });
  };

  // Open weight editor
  const openWeightEditor = (item) => {
    setWeightInput({
      isOpen: true,
      product: item,
      isEditing: true,
      cartItemId: item.id,
      initialWeight: item.quantity.toString()
    });
  };

  // Format weight for display
  const formatWeight = (weight) => {
    const value = parseFloat(weight);
    return isNaN(value) ? '0.000 kg' : `${value.toFixed(3).replace(/\.?0+$/, '')} kg`;
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Calculate cart total
  const cartTotal = cart.reduce(
    (total, item) => total + (item.sale_price * item.quantity),
    0
  );

  // Calculate change
  const change = Math.max(0, parseFloat(amountReceived || 0) - cartTotal);

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) return;
    
    // Validate payment for cash payments
    if (paymentMethod === 'DINHEIRO' && parseFloat(amountReceived || 0) < cartTotal) {
      setError('Valor recebido é menor que o total da compra');
      return;
    }
    
    setProcessing(true);
    setError('Processando venda...');

    const addItemsToCart = async (clearFirst = false) => {
      try {
        if (clearFirst) {
          console.log('Clearing cart before adding items...');
          await apiService.clearCart();
        }

        // Add all items to cart
        for (const item of cart) {
          const cartItem = {
            product_id: item.id,
            quantity: item.quantity,
            is_weight_sale: item.is_weight_based || false,
            weight_in_kg: item.is_weight_based ? item.quantity : undefined,
            custom_price: item.sale_price
          };
          
          console.log('Adding item to cart:', cartItem);
          await apiService.request('cart/add', {
            method: 'POST',
            body: cartItem,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
        }
        return true;
      } catch (error) {
        console.error('Error adding items to cart:', {
          error: error.message,
          status: error.status,
          response: error.response
        });
        throw error;
      }
    };

    try {
      // First try without clearing
      try {
        await addItemsToCart(false);
      } catch (firstError) {
        console.log('First attempt failed, retrying with cart clear');
        await addItemsToCart(true);
      }

      // Verify cart contents
      console.log('Verifying cart contents...');
      const cartContents = await apiService.request('cart', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('Cart contents:', cartContents);

      // Process checkout
      const checkoutData = {
        payment_method: paymentMethod,
        customer_id: null,
        notes: null,
        amount_received: paymentMethod === 'DINHEIRO' ? parseFloat(amountReceived) : cartTotal
      };

      console.log('Processing checkout with:', checkoutData);
      const result = await apiService.request('cart/checkout', {
        method: 'POST',
        body: checkoutData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Checkout successful:', result);
      
      // Clear local cart and reset form
      setCart([]);
      setPaymentMethod('DINHEIRO');
      setAmountReceived('');
      
      // Show success message
      setError('Venda registrada com sucesso!');
      setTimeout(() => setError(''), 3000);
      
      return result;
      
    } catch (error) {
      console.error('Error processing sale:', {
        error: error.message,
        status: error.status,
        response: error.response
      });
      
      let errorMessage = 'Erro ao processar venda';
      
      if (error.message === 'Failed to fetch') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      } else if (error.status === 401) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (error.status >= 500) {
        errorMessage = 'Erro no servidor. Por favor, tente novamente mais tarde.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Erro: ${errorMessage}`);
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Ponto de Venda</h1>
            <div className="w-1/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Buscar produto por código, nome ou descrição"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 h-full flex">
          {/* Products List - Takes 8 columns */}
          <div className="w-2/3 pr-4 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku || 'Sem código'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.is_weight_based 
                              ? formatWeight(product.current_stock) + ' kg' 
                              : product.current_stock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => addToCart(product)}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                                product.current_stock > 0 || product.is_weight_based
                                  ? product.is_weight_based
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                              disabled={!product.is_weight_based && product.current_stock <= 0}
                              title={product.is_weight_based ? 'Adicionar por peso' : 'Adicionar ao carrinho'}
                            >
                              {product.is_weight_based && <Scale className="h-3 w-3 mr-1" />}
                              {product.current_stock > 0 || product.is_weight_based
                                ? product.is_weight_based ? 'Pesar' : 'Adicionar'
                                : 'Sem Estoque'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Shopping Cart - Takes 4 columns */}
          <div className="w-1/3 bg-white rounded-lg shadow flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium text-gray-900">Carrinho de Compras</h2>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mb-2" />
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                <>
                  <div className={`overflow-y-auto ${cart.length > 2 ? 'max-h-64' : ''}`}>
                    {cart.map((item, index) => (
                      <div 
                        key={`${item.id}-${index}`} 
                        className="border-b p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="text-sm font-medium text-gray-900">
                                {item.name}
                                {item.is_weight_based && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    <Scale className="h-3 w-3 mr-1" />
                                    Peso
                                  </span>
                                )}
                              </h3>
                              <span className="text-sm font-medium text-gray-900 ml-2 whitespace-nowrap">
                                {formatCurrency(item.sale_price * item.quantity)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span>
                                {formatCurrency(item.sale_price)} {item.is_weight_based ? '/kg' : 'un.'}
                              </span>
                              <span className="mx-2">×</span>
                              <span className="font-medium">
                                {item.is_weight_based ? formatWeight(item.quantity) + ' kg' : item.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <div className="ml-4 flex-shrink-0 flex items-center space-x-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.is_weight_based)}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                              title="Remover uma unidade"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            
                            <span className="text-sm font-medium w-8 text-center">
                              {item.is_weight_based ? '✏️' : item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.is_weight_based)}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                              disabled={!item.is_weight_based && item.quantity >= (item.current_stock || 0)}
                              title="Adicionar uma unidade"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Summary - Fixed at the bottom */}
                  <div className="border-t p-4 bg-gray-50">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      
                      {/* Payment Method Selection */}
                      <div>
                        <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                          Forma de Pagamento
                        </label>
                        <div className="relative">
                          <select
                            id="payment-method"
                            value={paymentMethod}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              if (e.target.value !== 'DINHEIRO') {
                                setAmountReceived(cartTotal.toFixed(2));
                              } else {
                                setAmountReceived('');
                              }
                            }}
                            className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Amount Received (only for cash payments) */}
                      {paymentMethod === 'DINHEIRO' && (
                        <div>
                          <label htmlFor="amount-received" className="block text-sm font-medium text-gray-700 mb-1">
                            Valor Recebido
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="amount-received"
                              value={amountReceived}
                              onChange={(e) => setAmountReceived(e.target.value)}
                              min={cartTotal}
                              step="0.01"
                              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          {parseFloat(amountReceived || 0) < cartTotal && paymentMethod === 'DINHEIRO' && (
                            <p className="mt-1 text-sm text-red-600">
                              Valor insuficiente. Faltam {formatCurrency(cartTotal - parseFloat(amountReceived || 0))}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={processSale}
                        disabled={
                          cart.length === 0 || 
                          (paymentMethod === 'DINHEIRO' && parseFloat(amountReceived || 0) < cartTotal) ||
                          processing
                        }
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          cart.length === 0 || 
                          (paymentMethod === 'DINHEIRO' && parseFloat(amountReceived || 0) < cartTotal) ||
                          processing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Finalizar Venda
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={weightInput.isOpen}
        onClose={() => setWeightInput({ ...weightInput, isOpen: false })}
        productName={weightInput.product?.name || ''}
        pricePerKg={weightInput.product?.sale_price || 0}
        initialWeight={weightInput.initialWeight}
        maxWeight={weightInput.product?.track_inventory ? weightInput.product?.current_stock : null}
        onConfirm={handleWeightConfirm}
      />
    </div>
  );
};

export default PDV;
