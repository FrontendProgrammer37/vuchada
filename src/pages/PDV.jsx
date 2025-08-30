import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Scale } from 'lucide-react';
import apiService from '../services/api';
import WeightInputModal from '../components/WeightInputModal';

const PDV = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weightInput, setWeightInput] = useState({
    isOpen: false,
    product: null,
    isEditing: false,
    cartItemId: null
  });

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
    if (product.is_weight_based) {
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
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                            {product.is_weight_based && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <Scale className="h-3 w-3 mr-1" />
                                Peso
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description || 'Sem descrição'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span>{formatCurrency(product.sale_price)}</span>
                            {product.is_weight_based && (
                              <span className="text-xs text-gray-500">por kg</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.is_weight_based ? 'Peso' : (product.current_stock || 0)}
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
                            {product.current_stock > 0 || product.is_weight_base
                              ? product.is_weight_based ? 'Pesar' : 'Adicionar'
                              : 'Sem Estoque'}
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
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                              {item.is_weight_based && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <Scale className="h-3 w-3 mr-1" />
                                  Peso
                                </span>
                              )}
                            </h3>
                            <span className="text-sm font-medium text-gray-900 ml-2">
                              {formatCurrency(item.sale_price * item.quantity)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span>
                              {formatCurrency(item.sale_price)} {item.is_weight_based ? '/kg' : 'un.'}
                            </span>
                            <span className="mx-2">×</span>
                            <span className="font-medium">
                              {item.is_weight_based ? formatWeight(item.quantity) : item.quantity}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                          <button
                            onClick={() => 
                              item.is_weight_based 
                                ? openWeightEditor(item)
                                : updateQuantity(item.id, item.quantity - 1)
                            }
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            title={item.is_weight_based ? 'Editar quantidade' : 'Remover uma unidade'}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => item.is_weight_based && openWeightEditor(item)}
                            className={`text-sm font-medium w-8 text-center ${item.is_weight_based ? 'cursor-pointer text-purple-600 hover:text-purple-800' : ''}`}
                            title={item.is_weight_based ? 'Clique para editar o peso' : ''}
                          >
                            {item.is_weight_based ? '✏️' : item.quantity}
                          </button>
                          
                          <button
                            onClick={() => 
                              item.is_weight_base
                                ? openWeightEditor(item)
                                : updateQuantity(item.id, item.quantity + 1, item.is_weight_based)
                            }
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                            disabled={!item.is_weight_based && item.quantity >= (item.current_stock || 0)}
                            title={item.is_weight_based ? 'Editar quantidade' : 'Adicionar uma unidade'}
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
