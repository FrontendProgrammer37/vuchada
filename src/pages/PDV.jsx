import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, X, ShoppingCart, Scale, CreditCard, DollarSign, Info } from 'lucide-react';
import apiService from '../services/api';
import cartService from '../services/cartService';
import checkoutService from '../services/checkoutService';
import WeightInputModal from '../components/WeightInputModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import ConfirmationModal from '../components/ConfirmationModal';

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
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 });
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  useEffect(() => {
    setStockError(null);
  }, [cart]);

  // Load products and cart on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Initialize cart first
        await cartService.initializeCart();
        // Load products
        const productsData = await apiService.getProducts({ limit: 1000 });
        setProducts(productsData);
        // Load cart
        await loadCart();
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load cart from API
  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err);
      if (err.status === 404) {
        // Initialize empty cart if not found
        setCart({ items: [], subtotal: 0, tax_amount: 0, total: 0 });
      } else {
        setError(err.message || 'Erro ao carregar carrinho');
      }
    }
  };

  // Handle adding product to cart
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      setProcessing(true);
      
      // Log the product data for debugging
      console.log('Adding product to cart:', {
        id: product.id,
        name: product.name,
        sku: product.sku,
        codigo: product.codigo,
        allProps: product
      });
      
      // If product is sold by weight, show weight input modal
      if (product.is_weight_sale) {
        setSelectedProduct(product);
        setShowWeightModal(true);
        setProcessing(false);
        return;
      }

      // Create a product object with all necessary fields
      const productWithSku = {
        ...product,
        sku: product.sku || product.codigo || null
      };

      // Log the product data being sent to cart service
      console.log('Product data being sent to cart service:', productWithSku);

      // Add item to cart
      await cartService.addItem(productWithSku, quantity);
      
      // Update cart
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
      
      // Update product list to reflect stock changes
      const updatedProducts = products.map(p => 
        p.id === product.id 
          ? { ...p, stock_quantity: p.stock_quantity - quantity } 
          : p
      );
      setProducts(updatedProducts);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      // toast.error(error.message || 'Erro ao adicionar ao carrinho');
    } finally {
      setProcessing(false);
    }
  };

  // Handle weight confirmation
  const handleWeightConfirm = async (weight) => {
    try {
      setProcessing(true);
      const weightNum = parseFloat(weight);
      
      if (!selectedProduct) return;
      
      // Calculate total price based on weight
      const totalPrice = selectedProduct.unit_price * weightNum;
      
      // Create a product object with all necessary fields including SKU
      const productWithSku = {
        ...selectedProduct,
        sku: selectedProduct.sku || selectedProduct.codigo || null
      };
      
      // Add item to cart with weight
      await cartService.addItem(
        productWithSku, 
        1, // quantity is 1 for weight-based items
        true, // isWeightSale
        weightNum, // weightInKg
        totalPrice // customPrice
      );
      
      // Update cart
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
      
      // Update product list to reflect stock changes
      const updatedProducts = products.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, stock_quantity: p.stock_quantity - weightNum } 
          : p
      );
      setProducts(updatedProducts);
      
      // Reset state
      setShowWeightModal(false);
      setSelectedProduct(null);
      
    } catch (error) {
      console.error('Error adding weighted item to cart:', error);
      // toast.error(error.message || 'Erro ao adicionar item ao carrinho');
    } finally {
      setProcessing(false);
    }
  };

  // Process sale
  const processSale = async () => {
    if (cart.items.length === 0) {
      setError('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    // Validação do pagamento em dinheiro
    if (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total)) {
      setError('O valor recebido deve ser maior ou igual ao total da venda');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Dados para o checkout
      const checkoutData = {
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'DINHEIRO' ? parseFloat(amountReceived) : cart.total,
        customer_id: null, // Você pode adicionar um seletor de cliente posteriormente
        notes: '' // Você pode adicionar um campo de observações se necessário
      };

      // Chamar o serviço de checkout
      const result = await checkoutService.processCheckout(checkoutData);
      
      // Limpar carrinho após venda bem-sucedida
      await cartService.clearCart();
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
      setAmountReceived('');
      
      // Mostrar mensagem de sucesso com detalhes da venda
      // alert(`Venda #${result.sale_number} realizada com sucesso!\nTotal: ${formatCurrency(result.total_amount)}`);
      
    } catch (err) {
      console.error('Erro ao processar venda:', err);
      
      // Tratamento de erros específicos
      if (err.status === 422) {
        setError('Dados inválidos: ' + (err.detail || 'Verifique os dados informados'));
      } else if (err.status === 400) {
        setError('Erro na requisição: ' + (err.message || 'Dados inválidos'));
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao processar a venda. Tente novamente.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Sort products by name
  const sortedProducts = [...products].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt', {sensitivity: 'base'})
  );

  // Filter products based on search term
  const filteredProducts = sortedProducts.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency in MT (Metical)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code'
    }).format(value || 0).replace('MZN', 'MT');
  };

  // Format weight
  const formatWeight = (weight) => {
    return parseFloat(weight).toFixed(3);
  };

  // Toggle cart visibility on mobile
  const toggleCart = () => {
    setShowCart(!showCart);
  };

  const showProductDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Ponto de Venda</h1>
            <div className="w-full sm:w-1/2 md:w-1/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {/* Mobile cart button */}
            <button 
              onClick={toggleCart}
              className="sm:hidden flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span>{cart.itemCount || 0}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 h-full flex flex-col lg:flex-row">
          {/* Products List - Full width on mobile, 2/3 on larger screens */}
          <div className={`w-full lg:w-2/3 lg:pr-4 h-full flex flex-col mb-4 lg:mb-0 ${showCart ? 'hidden lg:flex' : 'flex'}`}>
            <div className="flex-1 overflow-y-auto bg-white shadow sm:rounded-lg">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 m-2">
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
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produto
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preço
                        </th>
                        <th scope="col" className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque
                        </th>
                        <th scope="col" className="relative px-3 sm:px-6 py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.sku || 'Sem código'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </td>
                          <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.is_weight_based 
                              ? formatWeight(product.current_stock) + ' kg' 
                              : product.current_stock}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Adicionar
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

          {/* Cart - Full width on mobile, 1/3 on larger screens */}
          <div className={`w-full lg:w-1/3 ${!showCart ? 'hidden lg:block' : ''}`}>
            <div className="bg-white shadow sm:rounded-lg h-full flex flex-col">
              <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Carrinho ({!cart.itemCount ? '0 itens' : `${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'itens'}`})
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
                    <p className="mt-1 text-sm text-gray-500">Adicione itens ao carrinho para continuar</p>
                  </div>
                ) : (
                  <div className={`${cart.items.length > 2 ? 'max-h-[50vh] overflow-y-auto pr-2' : ''}`}>
                    <ul className="divide-y divide-gray-200">
                      {cart.items.map((item, index) => (
                        <li key={`${item.id || 'item'}-${index}`} className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {item.product_name || item.name || item.nome}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.sku || item.codigo ? `Código: ${item.sku || item.codigo}` : 'Sem código'}
                              </p>
                            </div>
                            <div className="ml-4 flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.price || item.unit_price)} × {item.is_weight_sale ? formatWeight(item.quantity) + 'kg' : item.quantity}
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedProduct({
                                    ...item,
                                    nome: item.product_name || item.nome || item.name,
                                    preco_venda: item.price || item.unit_price,
                                    estoque: item.estoque_disponivel || item.estoque,
                                    is_weight_sale: item.is_weight_sale || false
                                  });
                                  setIsModalOpen(true);
                                }}
                                className="text-blue-500 hover:text-blue-700"
                                title="Ver detalhes"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    setStockError(null);
                                    const newQuantity = item.quantity - 1;
                                    if (newQuantity < 1) return;
                                  
                                    // Update local state first for immediate feedback
                                    setCart(prevCart => {
                                      const updatedItems = prevCart.items.map(i => 
                                        (i.product_id || i.id) === (item.product_id || item.id)
                                          ? { ...i, quantity: newQuantity, total_price: i.unit_price * newQuantity }
                                          : i
                                      );
                                      const subtotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
                                      return {
                                        ...prevCart,
                                        items: updatedItems,
                                        subtotal,
                                        total: subtotal
                                      };
                                    });
                                  
                                    // Then sync with backend
                                    await cartService.updateItemQuantity(item.product_id || item.id, newQuantity);
                                  
                                  } catch (err) {
                                    console.error('Erro ao diminuir quantidade:', err);
                                    setStockError(err.message);
                                    // Revert local state on error
                                    const refreshedCart = await cartService.getCart();
                                    setCart({
                                      ...refreshedCart,
                                      itemCount: refreshedCart.items?.length || 0,
                                      tax_amount: refreshedCart.tax_amount || 0
                                    });
                                  }
                                }}
                                className="text-yellow-500 hover:text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                                title="Diminuir quantidade"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              
                              <span className="mx-2 w-8 text-center">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={async () => {
                                  try {
                                    setStockError(null);
                                    const newQuantity = item.quantity + 1;
                                  
                                    // Check stock before making the API call
                                    if (item.estoque_disponivel !== undefined && newQuantity > item.estoque_disponivel) {
                                      throw new Error(`Estoque insuficiente. Disponível: ${item.estoque_disponivel}`);
                                    }
                                  
                                    // Update local state first for immediate feedback
                                    setCart(prevCart => {
                                      const updatedItems = prevCart.items.map(i => 
                                        (i.product_id || i.id) === (item.product_id || item.id)
                                          ? { ...i, quantity: newQuantity, total_price: i.unit_price * newQuantity }
                                          : i
                                      );
                                      const subtotal = updatedItems.reduce((sum, i) => sum + i.total_price, 0);
                                      return {
                                        ...prevCart,
                                        items: updatedItems,
                                        subtotal,
                                        total: subtotal
                                      };
                                    });
                                  
                                    // Then sync with backend
                                    await cartService.updateItemQuantity(item.product_id || item.id, newQuantity);
                                  
                                  } catch (err) {
                                    console.error('Erro ao aumentar quantidade:', err);
                                    setStockError(err.message);
                                    // Revert local state on error
                                    const refreshedCart = await cartService.getCart();
                                    setCart({
                                      ...refreshedCart,
                                      itemCount: refreshedCart.items?.length || 0,
                                      tax_amount: refreshedCart.tax_amount || 0
                                    });
                                  }
                                }}
                                className={`text-green-500 hover:text-green-700 ${
                                  (item.estoque_disponivel !== undefined && item.quantity >= item.estoque_disponivel) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                                title={
                                  item.estoque_disponivel !== undefined && item.quantity >= item.estoque_disponivel
                                    ? 'Estoque esgotado'
                                    : 'Aumentar quantidade'
                                }
                                disabled={item.estoque_disponivel !== undefined && item.quantity >= item.estoque_disponivel}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const updatedCart = await cartService.removeItem(item.product_id || item.id);
                                    setCart({
                                      ...updatedCart,
                                      itemCount: updatedCart.items?.length || 0,
                                      tax_amount: updatedCart.tax_amount || 0
                                    });
                                  } catch (err) {
                                    console.error('Erro ao remover item:', err);
                                    setError(err.message || 'Erro ao remover item do carrinho');
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                                disabled={processing}
                                title="Remover item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Imposto</span>
                    <span>{formatCurrency(cart.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t border-gray-200 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div>
                    <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pagamento
                    </label>
                    <select
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {paymentMethod === 'DINHEIRO' && (
                    <div>
                      <label htmlFor="amount-received" className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Recebido
                      </label>
                      <div className="mt-1">
                        <div className="relative rounded-lg shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-600 font-medium">MT</span>
                          </div>
                          <input
                            type="number"
                            name="amountReceived"
                            id="amountReceived"
                            value={amountReceived || ''}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="block w-full pl-12 pr-16 py-3 sm:text-lg font-medium border-0 focus:ring-0 focus:outline-none bg-transparent"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-sm font-medium">
                              {formatCurrency(amountReceived || 0).replace('MT', '')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {amountReceived && parseFloat(amountReceived) > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm font-medium text-gray-600">Total a pagar:</span>
                            <span className="text-base font-semibold text-gray-900">
                              {formatCurrency(cart.total || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <span className="text-sm font-medium text-blue-700">Troco:</span>
                            <span className="text-base font-bold text-blue-700">
                              {formatCurrency(parseFloat(amountReceived || 0) - parseFloat(cart.total || 0))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    onClick={processSale}
                    disabled={processing || cart.items.length === 0 || (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total))}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      processing || cart.items.length === 0 || (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total))
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    {processing ? 'Processando...' : 'Finalizar Venda'}
                  </button>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowClearCartConfirm(true)}
                      disabled={!cart.itemCount}
                      className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Limpar Carrinho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold">{formatCurrency(cart.total)}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={toggleCart}
              className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ShoppingCart className="h-5 w-5 mr-1" />
              <span>{cart.itemCount || 0}</span>
            </button>
            <button
              onClick={processSale}
              disabled={processing || cart.items.length === 0 || (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total))}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                processing || cart.items.length === 0 || (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              {processing ? '...' : 'Pagar'}
            </button>
          </div>
        </div>
      </div>

      {/* Stock error message */}
      {stockError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{stockError}</span>
          </div>
        </div>
      )}

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={showWeightModal}
        onClose={() => {
          setShowWeightModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleWeightConfirm}
        product={selectedProduct}
        pricePerKg={selectedProduct?.unit_price || 0}
        maxWeight={selectedProduct?.stock_quantity || 0}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />

      {/* Clear Cart Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearCartConfirm}
        onClose={() => setShowClearCartConfirm(false)}
        onConfirm={async () => {
          try {
            const clearedCart = await cartService.clearCart();
            setCart({
              ...clearedCart,
              itemCount: 0,
              tax_amount: 0
            });
            setAmountReceived('');
          } catch (err) {
            console.error('Erro ao limpar carrinho:', err);
          }
        }}
        title="Limpar Carrinho"
        message="Tem certeza que deseja remover todos os itens do carrinho?"
        confirmText="Sim, Limpar"
        cancelText="Cancelar"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PDV;
