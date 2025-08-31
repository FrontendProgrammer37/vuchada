import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Scale, CreditCard, DollarSign } from 'lucide-react';
import apiService from '../services/api';
import cartService from '../services/cartService';
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
  const [cart, setCart] = useState({ items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 });
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
  const [showCart, setShowCart] = useState(false);

  // Load products and cart on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
      setError('Erro ao carregar carrinho');
    }
  };

  // Add item to cart with inventory control
  const addToCart = async (product) => {
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

    try {
      await cartService.addItem(product, 1, false);
      await loadCart();
      setShowCart(true);
    } catch (err) {
      setError(err.message || 'Erro ao adicionar item ao carrinho');
    }
  };

  // Process sale
  const processSale = async () => {
    if (cart.items.length === 0) {
      setError('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    if (paymentMethod === 'DINHEIRO' && (!amountReceived || parseFloat(amountReceived) < cart.total)) {
      setError('O valor recebido deve ser maior ou igual ao total da venda');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await cartService.checkout(paymentMethod, amountReceived);
      // Handle successful sale
      setCart({ items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 });
      setAmountReceived('');
      alert('Venda realizada com sucesso!');
    } catch (err) {
      setError(err.message || 'Erro ao processar venda');
      console.error('Erro ao processar venda:', err);
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

  // Format weight
  const formatWeight = (weight) => {
    return parseFloat(weight).toFixed(3);
  };

  // Toggle cart visibility on mobile
  const toggleCart = () => {
    setShowCart(!showCart);
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
              <span>{cart.itemCount}</span>
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
                              onClick={() => addToCart(product)}
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
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Carrinho <span className="text-gray-500 text-sm">({cart.itemCount} itens)</span>
                  </h3>
                  <button 
                    onClick={toggleCart}
                    className="lg:hidden text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Fechar carrinho</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {cart.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Carrinho vazio</h3>
                    <p className="mt-1 text-sm text-gray-500">Adicione itens ao carrinho para continuar</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <li key={item.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.unit_price)} × {item.is_weight_sale ? formatWeight(item.quantity) + 'kg' : item.quantity}
                            </p>
                          </div>
                          <div className="ml-4 flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </p>
                            <button
                              onClick={async () => {
                                try {
                                  await cartService.removeItem(item.id);
                                  await loadCart();
                                } catch (err) {
                                  setError('Erro ao remover item do carrinho');
                                }
                              }}
                              className="ml-2 text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
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
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="amount-received"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          min={cart.total}
                          step="0.01"
                        />
                      </div>
                      {amountReceived && parseFloat(amountReceived) > 0 && (
                        <p className="mt-1 text-sm text-gray-500">
                          Troco: {formatCurrency(parseFloat(amountReceived) - cart.total)}
                        </p>
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
              Ver Carrinho ({cart.itemCount})
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

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={weightInput.isOpen}
        onClose={() => setWeightInput({ ...weightInput, isOpen: false })}
        product={weightInput.product}
        initialWeight={weightInput.initialWeight}
        onConfirm={async (weight, price) => {
          try {
            await cartService.addItem(weightInput.product, weight, true, price);
            await loadCart();
            setShowCart(true);
          } catch (err) {
            setError(err.message || 'Erro ao adicionar item ao carrinho');
          }
        }}
      />
    </div>
  );
};

export default PDV;
