import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart, Scale } from 'lucide-react';
import apiService from '../services/api';
import cartService from '../services/cartService';

// Função para formatar valores em Metical (MZN)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN'
  }).format(value);
};

// Função para formatar peso
const formatWeight = (weight) => {
  const value = parseFloat(weight);
  return isNaN(value) ? '0.000' : value.toFixed(3).replace(/\.?0+$/, '');
};

// Payment methods constant
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

const WeightInputModal = ({ 
  isOpen, 
  onClose, 
  product, 
  initialWeight = '0.100',
  onConfirm 
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setValue('');
      setError('');
    }
  }, [isOpen, initialWeight]);

  const calculateValue = (weight) => {
    const val = parseFloat(weight) * product.sale_price;
    return isNaN(val) ? '' : val.toFixed(2);
  };

  const calculateWeight = (val) => {
    const weight = parseFloat(val) / product.sale_price;
    return isNaN(weight) ? '' : weight.toFixed(3);
  };

  const handleWeightChange = (e) => {
    const newWeight = e.target.value;
    setWeight(newWeight);
    setValue(calculateValue(newWeight));
    validateInput(newWeight);
  };

  const handleValueChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    const calculatedWeight = calculateWeight(newValue);
    setWeight(calculatedWeight);
    validateInput(calculatedWeight);
  };

  const validateInput = (weight) => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Peso inválido');
      return false;
    }
    if (product.track_inventory && weightNum > product.current_stock) {
      setError(`Peso excede o estoque disponível de ${product.current_stock} kg`);
      return false;
    }
    setError('');
    return true;
  };

  const handleConfirm = () => {
    if (validateInput(weight)) {
      onConfirm(parseFloat(weight));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="bg-blue-50 px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-bold text-gray-900">Venda por Peso</h3>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-500">Código: {product.code || 'N/A'}</p>
            <p className="text-green-600 font-medium mt-1">
              Preço por KG: {formatCurrency(product.sale_price)}
            </p>
            {product.track_inventory && (
              <p className="text-blue-600 text-sm mt-1">
                Estoque disponível: {formatWeight(product.current_stock)} kg
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (MT)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">MT</span>
                </div>
                <input
                  type="number"
                  value={value}
                  onChange={handleValueChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (KG)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  value={weight}
                  onChange={handleWeightChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="0.000"
                  min="0.001"
                  step="0.001"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">KG</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Peso: {formatWeight(weight)} KG
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PDVPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);
  const [weightInput, setWeightInput] = useState({
    isOpen: false,
    product: null,
    isEditing: false,
    cartItemId: null
  });
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [amountReceived, setAmountReceived] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, cartData] = await Promise.all([
          apiService.getProducts({ limit: 1000 }),
          cartService.getCart()
        ]);
        
        const mappedProducts = productsData.map(product => ({
          ...product,
          is_weight_based: product.venda_por_peso || false,
          current_stock: product.estoque,
          sale_price: product.preco_venda,
          price: product.preco_compra
        }));
        
        setProducts(mappedProducts);
        setCart(cartData.items || []);
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Adicionar item ao carrinho
  const addToCart = async (product) => {
    try {
      if (product.is_weight_based) {
        setWeightInput({
          isOpen: true,
          product: { ...product, maxWeight: product.track_inventory ? product.current_stock : null },
          isEditing: false
        });
        return;
      }
      await cartService.addItem(product, 1, false);
      const updatedCart = await cartService.getCart();
      setCart(updatedCart.items);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao adicionar ao carrinho');
    }
  };

  // Handle weight confirmation
  const handleWeightConfirm = async (product, weight) => {
    try {
      await cartService.addItem({
        ...product,
        quantity: parseFloat(weight),
        is_weight_based: true
      });
      const updatedCart = await cartService.getCart();
      setCart(updatedCart.items || []);
    } catch (error) {
      console.error('Error adding weighted item:', error);
      // Handle error
    }
  };

  // Atualizar quantidade
  const updateQuantity = async (itemId, newQuantity, isWeightBased = false) => {
    try {
      if (newQuantity <= 0) {
        await removeFromCart(itemId);
        return;
      }
      await cartService.updateItemQuantity(itemId, isWeightBased ? parseFloat(newQuantity) : Math.floor(newQuantity));
      const updatedCart = await cartService.getCart();
      setCart(updatedCart.items);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar quantidade');
    }
  };

  // Remover item do carrinho
  const removeFromCart = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      const updatedCart = await cartService.getCart();
      setCart(updatedCart.items);
      setError(null);
    } catch (err) {
      setError('Erro ao remover item do carrinho');
    }
  };

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // For cash payments, ensure amount received is sufficient
    if (paymentMethod === 'DINHEIRO') {
      const received = parseFloat(amountReceived);
      if (isNaN(received) || received < cartTotal) {
        alert('Por favor, insira um valor recebido válido');
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Prepare the order data
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          unit_price: item.unit_price || item.price,
          weight: item.weight || null,
          subtotal: (item.unit_price || item.price) * item.quantity
        })),
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'DINHEIRO' ? parseFloat(amountReceived) : cartTotal,
        total: cartTotal,
        change: paymentMethod === 'DINHEIRO' ? (parseFloat(amountReceived) - cartTotal).toFixed(2) : 0
      };

      // Call the cart service to process the checkout
      await cartService.checkout(orderData.payment_method, orderData.amount_received);
      
      // Clear the cart and reset form
      setCart([]);
      setPaymentMethod('DINHEIRO');
      setAmountReceived('');
      
      // Show success message
      alert('Venda realizada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert(error.message || 'Ocorreu um erro ao processar a venda. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular o total do carrinho
  const cartTotal = cart.reduce((total, item) => {
    return total + ((item.unit_price || item.price) * item.quantity);
  }, 0);

  // Função para verificar se o botão de finalizar deve estar desabilitado
  const isCheckoutDisabled = () => {
    if (isLoading || cart.length === 0) return true;
    if (paymentMethod === 'DINHEIRO') {
      return !amountReceived || isNaN(parseFloat(amountReceived)) || parseFloat(amountReceived) < cartTotal;
    }
    return false;
  };

  // Atualizar o valor recebido quando o total mudar
  useEffect(() => {
    if (paymentMethod !== 'DINHEIRO' && cartTotal > 0) {
      setAmountReceived(cartTotal.toFixed(2));
    }
  }, [cartTotal, paymentMethod]);

  // Renderizar o botão de finalizar venda
  const renderCheckoutButton = () => (
    <button
      onClick={handleCheckout}
      disabled={isCheckoutDisabled()}
      className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white mt-4 ${
        isCheckoutDisabled()
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processando...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Check className="mr-2" size={20} />
          Finalizar Venda
        </div>
      )}
    </button>
  );

  const totalItems = cart.reduce((sum, item) => sum + (item.is_weight_based ? 1 : item.quantity), 0);
  const change = amountReceived ? (parseFloat(amountReceived) - cartTotal).toFixed(2) : 0;

  // Renderizar produto na lista
  const renderProduct = (product) => (
    <div
      key={product.id}
      onClick={() => addToCart(product)}
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <h3 className="font-medium text-gray-900">{product.name}</h3>
      <p className="text-green-600 font-medium">{formatCurrency(product.sale_price)}</p>
      {product.track_inventory && (
        <p className="text-sm text-gray-500">
          Estoque: {product.is_weight_based ? formatWeight(product.current_stock) + ' kg' : product.current_stock}
        </p>
      )}
    </div>
  );

  // Renderizar item do carrinho
  const renderCartItem = (item) => (
    <div key={item.id} className="border-b py-3 px-4">
      <div className="flex justify-between">
        <div>
          <h4 className="font-medium">{item.name}</h4>
          {item.is_weight_based ? (
            <p className="text-sm text-gray-500">
              {formatWeight(item.quantity)} kg × {formatCurrency(item.unit_price)}/kg
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {item.quantity} × {formatCurrency(item.unit_price)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(item.quantity * item.unit_price)}</p>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );

  // Limpar carrinho
  const clearCart = () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      setCart([]);
    }
  };

  // Renderizar botão de limpar carrinho (visível apenas quando houver itens)
  const renderClearCartButton = () => {
    if (cart.length === 0) return null;
    
    return (
      <button
        onClick={clearCart}
        className="mt-2 w-full bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
      >
        <X size={16} className="mr-1" />
        Limpar Venda
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800">Nova Venda</h1>
          <p className="text-gray-600">Selecione os produtos para adicionar ao carrinho</p>
        </div>
        
        {/* Botão do carrinho para desktop */}
        {!isMobile && (
          <div className="relative">
            <button
              onClick={() => setShowCart(!showCart)}
              className="bg-white p-3 rounded-full shadow-md hover:shadow-lg transition-shadow relative"
              aria-label="Ver carrinho"
            >
              <ShoppingCart className="text-gray-700" size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
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
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Área de produtos */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map(renderProduct)}
            </div>
          </div>

          {/* Carrinho de compras */}
          <div 
            className={`${isMobile 
              ? (showCart ? 'fixed inset-0 bg-white z-50 p-4 overflow-y-auto' : 'hidden') 
              : (showCart ? 'w-96' : 'hidden lg:block w-0')} 
              transition-all duration-300 ease-in-out`}
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-full">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="mr-2" size={20} />
                  Carrinho
                  {totalItems > 0 && (
                    <span className="ml-2 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  aria-label="Fechar carrinho"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-1 flex flex-col overflow-hidden">
                {cart.length === 0 ? (
                  <div className="text-center py-8 px-4 flex-1 flex flex-col items-center justify-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <ShoppingCart className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-gray-600 font-medium mb-1">Carrinho vazio</h3>
                    <p className="text-sm text-gray-500">Adicione produtos ao carrinho</p>
                  </div>
                ) : (
                  <>
                    <div className={`overflow-y-auto ${cart.length > 2 ? 'max-h-64' : 'max-h-full'}`}>
                      {cart.map(renderCartItem)}
                    </div>
                    
                    {/* Payment Section */}
                    <div className={`border-t border-gray-200 p-4 bg-white ${cart.length > 2 ? 'overflow-y-auto flex-1' : ''}`}>
                      {/* Payment form */}
                      <div className="space-y-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Forma de Pagamento
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => {
                              setPaymentMethod(e.target.value);
                              if (e.target.value !== 'DINHEIRO') {
                                setAmountReceived(cartTotal.toFixed(2));
                              } else {
                                setAmountReceived('');
                              }
                            }}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount Received (only for cash) */}
                        {paymentMethod === 'DINHEIRO' && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Valor Recebido
                            </label>
                            <div className="relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">MT</span>
                              </div>
                              <input
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="0.00"
                                min={cartTotal}
                                step="0.01"
                              />
                            </div>
                            {parseFloat(amountReceived || 0) < cartTotal && (
                              <p className="mt-1 text-sm text-red-600">
                                Valor insuficiente. Faltam {formatCurrency(cartTotal - parseFloat(amountReceived || 0))}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Order Summary */}
                        <div className="border-t border-gray-200 pt-3 mt-2">
                          <div className="flex justify-between py-1">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="text-sm font-medium">{formatCurrency(cartTotal)}</span>
                          </div>
                          
                          {paymentMethod === 'DINHEIRO' && parseFloat(amountReceived || 0) > 0 && (
                            <div className="flex justify-between py-1">
                              <span className="text-sm text-gray-600">Troco:</span>
                              <span className="text-sm font-bold text-green-600">
                                {formatCurrency(parseFloat(amountReceived) - cartTotal)}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between py-1 font-medium text-base mt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(cartTotal)}</span>
                          </div>
                        </div>

                        {/* Checkout Button */}
                        {renderCheckoutButton()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante do carrinho (somente mobile) */}
      {isMobile && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors flex items-center justify-center relative"
            aria-label="Ver carrinho"
          >
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Weight Input Modal */}
      <WeightInputModal
        isOpen={weightInput.isOpen}
        onClose={() => setWeightInput({ ...weightInput, isOpen: false })}
        product={weightInput.product}
        onConfirm={handleWeightConfirm}
      />
    </div>
  );
};

export default PDVPage;
