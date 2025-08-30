import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import saleService from '../services/saleService';
import cartService from '../services/cartService';
import productService from '../services/productService';
import toast from '../utils/toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PDV = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts({ limit: 1000 }); // Get all products
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

  // Add product to cart with stock validation
  const addToCart = (product) => {
    // Check available stock (total stock - items in cart)
    const inCart = cart.find(item => item.id === product.id)?.quantity || 0;
    const availableStock = product.current_stock - inCart;
    
    if (availableStock <= 0) {
      toast.warning('Produto sem estoque disponível');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Check if we have enough stock
        if (existingItem.quantity >= product.current_stock) {
          toast.warning('Quantidade máxima em estoque atingida');
          return prevCart;
        }
        
        toast.success('Quantidade atualizada no carrinho');
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        toast.success('Produto adicionado ao carrinho');
        return [
          ...prevCart,
          {
            ...product,
            quantity: 1,
            unit_price: product.sale_price,
            total: product.sale_price
          }
        ];
      }
    });
  };

  // Update item quantity in cart with stock validation
  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Calculate how many are already in the cart (excluding current item being updated)
    const currentInCart = cart.find(item => item.id === id)?.quantity || 0;
    const otherItemsInCart = cart.filter(item => item.id !== id).reduce((sum, item) => sum + item.quantity, 0);
    const availableForThisItem = product.current_stock - otherItemsInCart;
    
    if (newQuantity > availableForThisItem) {
      toast.warning(`Apenas ${availableForThisItem} itens disponíveis em estoque`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
          : item
      )
    );
    
    if (newQuantity > currentInCart) {
      toast.success('Quantidade aumentada no carrinho');
    } else {
      toast.info('Quantidade reduzida no carrinho');
    }
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    const item = cart.find(item => item.id === id);
    if (item) {
      toast.info(`${item.name} removido do carrinho`);
    }
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.warning('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    if (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cartTotal)) {
      toast.error('O valor recebido deve ser maior ou igual ao total da venda');
      return;
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total
        })),
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'dinheiro' ? parseFloat(amountReceived) : cartTotal,
        total_amount: cartTotal,
        change: paymentMethod === 'dinheiro' ? change : 0
      };

      await saleService.createSale(saleData);
      
      // Clear cart and reset form
      await cartService.clearCart();
      setCart([]);
      setAmountReceived('');
      setPaymentMethod('dinheiro');
      
      toast.success('Venda realizada com sucesso!');
      
      // Refresh product list to update stock
      const updatedProducts = await productService.getProducts({ limit: 1000 });
      setProducts(updatedProducts);
      
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(error.message || 'Erro ao processar venda. Tente novamente.');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Get available stock considering items in cart
  const getAvailableStock = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    const inCart = cart.find(item => item.id === productId)?.quantity || 0;
    return Math.max(0, product.current_stock - inCart);
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'mbway', label: 'MB Way' },
    { value: 'multibanco', label: 'Multibanco' },
    { value: 'visa', label: 'Cartão Visa' },
    { value: 'mastercard', label: 'Cartão Mastercard' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const cartTotal = cart.reduce(
    (total, item) => total + (item.sale_price * item.quantity),
    0
  );

  const change = Math.max(0, parseFloat(amountReceived || 0) - cartTotal);

  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Product List */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Pesquisar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estoque
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const availableStock = getAvailableStock(product.id);
                      const isOutOfStock = availableStock <= 0;
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isOutOfStock ? 'Sem Estoque' : `${availableStock} disponíveis`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(product.sale_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => addToCart(product)}
                              disabled={isOutOfStock}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
                                isOutOfStock
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                              }`}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Adicionar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Shopping Cart */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Carrinho <span className="text-gray-500">({itemsCount} itens)</span>
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <div className="mt-1 text-sm text-gray-500">
                            {formatCurrency(item.unit_price)} × {item.quantity}
                          </div>
                          <div className="mt-1 text-sm font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-2 text-sm text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={getAvailableStock(item.id) <= 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between py-2 text-sm font-medium text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {paymentMethod === 'dinheiro' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Recebido
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      placeholder="0.00"
                    />
                    {amountReceived && (
                      <div className="mt-2 text-sm font-medium text-gray-700">
                        Troco: {formatCurrency(change)}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex justify-between text-lg font-bold py-2 border-t border-gray-200 mt-4">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  
                  <button
                    onClick={processSale}
                    disabled={cart.length === 0 || (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cartTotal))}
                    className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      cart.length === 0 || (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cartTotal))
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    Finalizar Venda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDV;
