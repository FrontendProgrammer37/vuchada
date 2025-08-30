import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import apiService from '../services/api';

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

  // Add item to cart
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Update item quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
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
    
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          total_price: item.sale_price * item.quantity
        })),
        payment_method: paymentMethod,
        amount_received: parseFloat(amountReceived || cartTotal),
        total_amount: cartTotal
      };

      await apiService.createSale(saleData);
      
      // Clear cart and reset form
      setCart([]);
      setAmountReceived('');
      
      // Show success message
      alert('Venda realizada com sucesso!');
    } catch (err) {
      console.error('Erro ao processar venda:', err);
      alert('Erro ao processar venda. Tente novamente.');
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Ponto de Venda (PDV)</h1>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span>Carrinho ({cart.reduce((acc, item) => acc + item.quantity, 0)})</span>
              </div>
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => {
                if (cart.length > 0 && window.confirm('Tem certeza que deseja iniciar uma nova venda?')) {
                  setCart([]);
                  setAmountReceived('');
                } else if (cart.length === 0) {
                  setCart([]);
                  setAmountReceived('');
                }
              }}
            >
              Nova Venda
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Product List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <div className="mb-4">
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

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.sku || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description || 'Sem descrição'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(product.sale_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.current_stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => addToCart(product)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={product.current_stock <= 0}
                          >
                            {product.current_stock > 0 ? 'Adicionar' : 'Sem Estoque'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Panel - Shopping Cart */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Carrinho de Compras</h2>
            
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">Seu carrinho está vazio</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="border-b pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.sale_price)} un.
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            disabled={item.quantity >= (item.current_stock || 0)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 text-right text-sm font-medium">
                        {formatCurrency(item.sale_price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">Subtotal:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  
                  <div className="mt-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="mpesa">M-PESA</option>
                      <option value="emola">E-Mola</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="transferencia">Transferência Bancária</option>
                    </select>
                  </div>

                  {paymentMethod === 'dinheiro' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Recebido
                      </label>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      {parseFloat(amountReceived || 0) < cartTotal && (
                        <p className="mt-1 text-sm text-red-600">
                          Valor insuficiente
                        </p>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'dinheiro' && amountReceived && (
                    <div className="flex justify-between mb-4">
                      <span className="text-sm font-medium text-gray-500">Troco:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(change)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-bold mb-4 pt-2 border-t">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={processSale}
                      disabled={
                        cart.length === 0 || 
                        (paymentMethod === 'dinheiro' && parseFloat(amountReceived || 0) < cartTotal)
                      }
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        cart.length === 0 || 
                        (paymentMethod === 'dinheiro' && parseFloat(amountReceived || 0) < cartTotal)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Finalizar Venda
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja cancelar esta venda?')) {
                          setCart([]);
                          setAmountReceived('');
                        }
                      }}
                      disabled={cart.length === 0}
                      className={`w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${
                        cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Cancelar Venda
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PDV;
