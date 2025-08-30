import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart } from 'lucide-react';
import apiService from '../services/api';
import { useCart } from '../contexts/CartContext';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);
  
  // Usando o hook useCart para acessar o carrinho e suas funções
  const { 
    cart, 
    loading: cartLoading, 
    error: cartError, 
    addToCart, 
    removeFromCart, 
    updateItemQuantity, 
    clearCart,
    checkout: checkoutCart
  } = useCart();

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

  // Lidar com redimensionamento da janela
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      setShowCart(!isMobileView);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Renderizar produto na lista
  const renderProduct = (product) => (
    <div key={product.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-gray-800">{product.name}</h3>
      <p className="text-gray-600 text-sm mb-2">{product.description || 'Sem descrição'}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold text-blue-600">{formatCurrency(product.sale_price)}</span>
        <button
          onClick={() => addToCart(product.id, 1)}
          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
          aria-label="Adicionar ao carrinho"
          disabled={cartLoading}
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
              removeFromCart(item.id);
            } else {
              updateItemQuantity(item.id, newQuantity);
            }
          }}
          className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Diminuir quantidade"
          disabled={cartLoading}
        >
          <Minus size={16} />
        </button>
        <span className="mx-2 w-6 text-center text-gray-700">{item.quantity}</span>
        <button
          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
          className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Aumentar quantidade"
          disabled={cartLoading}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  // Calcular total do carrinho
  const cartTotal = cart.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  const totalItems = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Função para finalizar a venda
  const handleCheckout = async () => {
    if (cart.items?.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    try {
      // Aqui você pode adicionar um modal para selecionar o método de pagamento
      // Por enquanto, vamos usar 'DINHEIRO' como padrão
      const paymentMethod = 'DINHEIRO';
      
      const result = await checkoutCart(paymentMethod);
      
      alert(`Venda finalizada com sucesso! Número da venda: ${result.sale_number}`);
      setShowCart(false);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert(`Erro ao finalizar venda: ${error.message || 'Tente novamente mais tarde.'}`);
    }
  };

  // Renderizar botão de limpar carrinho
  const renderClearCartButton = () => {
    if (!cart.items?.length) return null;
    
    return (
      <button
        onClick={clearCart}
        disabled={cartLoading}
        className="mt-2 w-full bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X size={16} className="mr-1" />
        Limpar Venda
      </button>
    );
  };

  // Se estiver carregando os produtos
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Se ocorrer um erro ao carregar os produtos
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Erro ao carregar produtos</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lista de produtos */}
        <div className={`${showCart ? 'lg:w-2/3' : 'w-full'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(renderProduct)}
          </div>
        </div>

        {/* Carrinho de compras */}
        <div 
          className={`fixed inset-0 lg:static lg:block bg-white z-20 transform transition-transform duration-300 ease-in-out ${
            showCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          } lg:w-1/3`}
        >
          <div className="h-full flex flex-col border-l border-gray-200 bg-white shadow-lg lg:rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Carrinho de Compras</h2>
              <button 
                onClick={() => setShowCart(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
                aria-label="Fechar carrinho"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col h-[calc(100%-60px)]">
              {!cart.items?.length ? (
                <div className="text-center py-8 px-4 flex-1 flex flex-col items-center justify-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <ShoppingCart className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-1">Carrinho vazio</h3>
                  <p className="text-gray-500 text-sm">Adicione produtos ao carrinho</p>
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto flex-1 p-4">
                    {cart.items.map(renderCartItem)}
                  </div>
                  
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex justify-between text-lg font-semibold mb-4">
                      <span>Total:</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!cart.items?.length || cartLoading}
                    >
                      {cartLoading ? (
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Botão flutuante do carrinho para mobile */}
      {isMobile && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-10 lg:hidden"
          aria-label="Ver carrinho"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
};

export default PDVPage;
