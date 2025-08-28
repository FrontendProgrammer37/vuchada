import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Check, ChevronDown, User, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiService from '../services/api';

// Função para formatar valores em Metical (MZN)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const PDVPage = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [discount, setDiscount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(false);
  
  const navigate = useNavigate();

  // Buscar produtos da API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const productsData = await apiService.getProducts({ limit: 100 }); // Aumentei o limite para buscar mais produtos
      
      // Mapear os produtos para o formato esperado pelo componente
      const formattedProducts = productsData.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.sale_price) || 0,
        stock: parseInt(product.current_stock) || 0,
        sku: product.sku || '',
        category_id: product.category_id || null
      }));
      
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos. Tente novamente.');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Verificar tamanho da tela
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setShowCart(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Adicionar item ao carrinho
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        // Se o item já está no carrinho, aumenta a quantidade
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Adiciona novo item ao carrinho
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    
    if (isMobile) {
      setShowCart(true);
    }
    
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  // Remover item do carrinho
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Atualizar quantidade de um item no carrinho
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calcular total do carrinho
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calcular troco
  const change = paymentMethod === 'dinheiro' && amountReceived 
    ? parseFloat(amountReceived) - cartTotal + (parseFloat(discount) || 0)
    : 0;

  // Finalizar venda
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warning('Adicione itens ao carrinho antes de finalizar');
      return;
    }
    
    if (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cartTotal - (parseFloat(discount) || 0))) {
      toast.error('Valor recebido insuficiente');
      return;
    }
    
    // Aqui você faria a chamada para a API para finalizar a venda
    console.log('Finalizando venda:', {
      items: cart,
      paymentMethod,
      amountReceived,
      discount: parseFloat(discount) || 0,
      customerName,
      total: cartTotal,
      change: change > 0 ? change : 0
    });
    
    // Simulando sucesso na venda
    toast.success('Venda finalizada com sucesso!');
    
    // Limpar carrinho e fechar modal
    setCart([]);
    setShowPaymentModal(false);
    setCustomerName('');
    setAmountReceived('');
    setDiscount('');
  };

  // Renderizar produto
  const renderProduct = (product) => (
    <div 
      key={product.id}
      className="bg-white rounded-lg shadow p-4 flex flex-col h-full"
    >
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        {product.sku && <p className="text-xs text-gray-500 mb-1">{product.sku}</p>}
        <p className="text-gray-600 text-sm">Estoque: {product.stock}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-bold">
          {formatCurrency(product.price)}
        </span>
        <button
          onClick={() => addToCart(product)}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Adicionar ${product.name} ao carrinho`}
          disabled={product.stock <= 0}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );

  // Renderizar item do carrinho
  const renderCartItem = (item) => (
    <div key={item.id} className="flex justify-between items-center py-3 border-b">
      <div className="flex-1">
        <h4 className="font-medium">{item.name}</h4>
        <p className="text-sm text-gray-600">
          {formatCurrency(item.price)} cada
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="text-gray-500 hover:text-blue-600 p-1"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="w-6 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="text-gray-500 hover:text-blue-600 p-1"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 p-1 ml-2"
          aria-label="Remover item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Área de produtos */}
        <div className={`${showCart && isMobile ? 'hidden' : 'block'} lg:block flex-1`}>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 h-32 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(renderProduct)
              ) : (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Nenhum produto encontrado
                </div>
              )}
            </div>
          )}
        </div>

        {/* Carrinho de compras */}
        {showCart && (
          <div className={`${isMobile ? 'fixed inset-0 bg-white z-50 p-4 overflow-y-auto' : 'w-full lg:w-96'}`}>
            {isMobile && (
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Carrinho</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <ShoppingCart className="mr-2" />
                  Carrinho
                </h2>
                {cart.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} itens
                  </span>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Seu carrinho está vazio</p>
                  {isMobile && (
                    <button
                      onClick={() => setShowCart(false)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Voltar para produtos
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto mb-4">
                    {cart.map(renderCartItem)}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(cartTotal)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center mt-4"
                      disabled={cart.length === 0}
                    >
                      <Check className="mr-2" size={18} />
                      Finalizar Venda
                    </button>
                    
                    <button
                      onClick={() => setCart([])}
                      className="w-full mt-2 text-red-600 py-2 rounded-md border border-red-600 hover:bg-red-50 flex items-center justify-center"
                      disabled={cart.length === 0}
                    >
                      <Trash2 className="mr-2" size={16} />
                      Limpar Carrinho
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botão flutuante do carrinho (mobile) */}
      {!showCart && isMobile && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            aria-label="Ver carrinho"
          >
            <ShoppingCart size={24} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </button>
        </div>
      )}

      {/* Modal de pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Finalizar Venda</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente (opcional)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pagamento
                  </label>
                  <div className="mt-1">
                    <select
                      className="w-full p-2 border rounded-md"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="transferencia">Transferência Bancária</option>
                    </select>
                  </div>
                </div>
                
                {paymentMethod === 'dinheiro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Recebido
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="0,00"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {amountReceived && parseFloat(amountReceived) < (cartTotal - (parseFloat(discount) || 0)) && (
                      <p className="mt-1 text-sm text-red-600">
                        Valor insuficiente. Faltam {formatCurrency((cartTotal - (parseFloat(discount) || 0)) - parseFloat(amountReceived))}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desconto (opcional)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="0,00"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      step="0.01"
                      min="0"
                      max={cartTotal}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between mb-2">
                    <span>Total:</span>
                    <span className="font-bold">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  
                  {parseFloat(discount) > 0 && (
                    <div className="flex justify-between mb-2 text-red-600">
                      <span>Desconto:</span>
                      <span>-{formatCurrency(parseFloat(discount))}</span>
                    </div>
                  )}
                  
                  {paymentMethod === 'dinheiro' && amountReceived && (
                    <div className="flex justify-between mb-2">
                      <span>Troco:</span>
                      <span className="font-medium">
                        {change > 0 
                          ? formatCurrency(change)
                          : 'Sem troco'}
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center mt-4"
                  >
                    <Check className="mr-2" size={18} />
                    Confirmar Venda
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVPage;
