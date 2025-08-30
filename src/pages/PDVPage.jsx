import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart, User, CreditCard } from 'lucide-react';
import cartService from '../services/cartService';
import checkoutService from '../services/checkoutService';
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

// Componente para seleção de método de pagamento
const PaymentMethodSelector = ({ selectedMethod, onSelect }) => {
  const paymentMethods = [
    { id: 'DINHEIRO', label: 'Dinheiro' },
    { id: 'MPESA', label: 'M-Pesa' },
    { id: 'CARTAO_POS', label: 'Cartão POS' },
    { id: 'TRANSFERENCIA', label: 'Transferência' },
  ];

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Método de Pagamento</h3>
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.id)}
            className={`flex items-center justify-center p-3 border rounded-md text-sm font-medium ${
              selectedMethod === method.id
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {method.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente para seleção de cliente
const CustomerSelector = ({ customerId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Função para buscar clientes (implementar busca na API)
  const searchCustomers = async (term) => {
    // Implementar busca de clientes
    // Exemplo: const results = await customerService.search(term);
    // setCustomers(results);
  };

  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => searchCustomers(searchTerm), 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  return (
    <div className="mt-4 relative">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Cliente</h3>
      <div className="relative">
        <div className="flex items-center">
          <User className="absolute left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSelect(customer.id);
                    setIsOpen(false);
                  }}
                >
                  {customer.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Digite para buscar clientes'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PDVPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [customerId, setCustomerId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Buscar produtos da API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Busca todos os produtos sem paginação para o PDV
        const productsData = await apiService.getProducts({ limit: 1000 });
        setProducts(productsData);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        setError('Erro ao carregar produtos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Carregar carrinho ao iniciar
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await cartService.getCart();
        setCart(cartData);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        setError('Não foi possível carregar o carrinho');
      }
    };

    loadCart();
  }, []);

  // Adicionar item ao carrinho
  const addToCart = async (product) => {
    try {
      await cartService.addItem(product.id, 1);
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao adicionar item ao carrinho');
    }
  };

  // Atualizar quantidade do item
  const updateQuantity = async (productId, quantity) => {
    try {
      if (quantity < 1) {
        await cartService.removeItem(productId);
      } else {
        await cartService.updateItemQuantity(productId, quantity);
      }
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      alert('Erro ao atualizar quantidade');
    }
  };

  // Remover item do carrinho
  const removeItem = async (productId) => {
    try {
      await cartService.removeItem(productId);
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
    } catch (error) {
      console.error('Erro ao remover item:', error);
      alert('Erro ao remover item do carrinho');
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    if (window.confirm('Tem certeza que deseja limpar o carrinho?')) {
      try {
        await cartService.clearCart();
        setCart({ items: [], total: 0 });
      } catch (error) {
        console.error('Erro ao limpar carrinho:', error);
        alert('Erro ao limpar carrinho');
      }
    }
  };

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await checkoutService.processCheckout({
        payment_method: paymentMethod,
        customer_id: customerId,
        notes: ''
      });
      
      alert(`Venda #${result.sale_number} finalizada com sucesso!`);
      await cartService.clearCart();
      setCart({ items: [], total: 0 });
      setCustomerId(null);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert(`Erro ao finalizar venda: ${error.message || 'Tente novamente mais tarde'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Renderizar produto na lista
  const renderProduct = (product) => (
    <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-gray-800">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-2">{product.description || 'Sem descrição'}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold text-blue-600">{formatCurrency(product.sale_price)}</span>
        <button
          onClick={() => addToCart(product)}
          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
          aria-label="Adicionar ao carrinho"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  // Renderizar item do carrinho
  const renderCartItem = (item) => (
    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100">
      <div className="flex-1">
        <div className="font-medium text-gray-800">{item.name}</div>
        <div className="text-sm text-gray-500">
          {formatCurrency(item.price)} × {item.quantity}
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            const newQuantity = item.quantity - 1;
            if (newQuantity === 0) {
              removeItem(item.id);
            } else {
              updateQuantity(item.id, newQuantity);
            }
          }}
          className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="mx-2 w-6 text-center text-gray-700">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  // Calcular total do carrinho
  const cartTotal = cart.total;

  // Renderizar botão de limpar carrinho (visível apenas quando houver itens)
  const renderClearCartButton = () => {
    if (cart.items.length === 0) return null;
    
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
    <div className="container mx-auto p-4 md:p-6">
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
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {cart.items.length}
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Área de produtos */}
          <div className={`${showCart && isMobile ? 'hidden' : 'block'} lg:block flex-1`}>
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
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <ShoppingCart className="mr-2" size={20} />
                  Carrinho
                  {cart.items.length > 0 && (
                    <span className="ml-2 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'}
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

              <div className="flex flex-col h-[calc(100%-60px)]">
                {cart.items.length === 0 ? (
                  <div className="text-center py-8 px-4 flex-1 flex flex-col items-center justify-center">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <ShoppingCart className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-gray-600 font-medium mb-1">Carrinho vazio</h3>
                    <p className="text-sm text-gray-500">Adicione produtos ao carrinho</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto flex-1 p-4">
                      {cart.items.map(renderCartItem)}
                    </div>
                    
                    <div className="border-t border-gray-100 p-4">
                      <CustomerSelector 
                        customerId={customerId}
                        onSelect={setCustomerId}
                      />
                      
                      <PaymentMethodSelector 
                        selectedMethod={paymentMethod}
                        onSelect={setPaymentMethod}
                      />
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">Total:</span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(cartTotal)}
                          </span>
                        </div>
                        
                        <button
                          onClick={handleCheckout}
                          disabled={isCheckingOut || cart.items.length === 0}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingOut ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processando...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2" size={18} />
                              Finalizar Venda
                            </>
                          )}
                        </button>
                        
                        {renderClearCartButton()}
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
            {cart.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {cart.items.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PDVPage;
