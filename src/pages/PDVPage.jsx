import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart } from 'lucide-react';
import apiService from '../services/api';
import cartService from '../services/cartService'; // Import the cartService

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
  const [cart, setCart] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);

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

  // Adicionar item ao carrinho
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
      return [...prevCart, { 
        ...product, 
        quantity: 1,
        price: product.sale_price // Usar preço de venda do produto
      }];
    });
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
              setCart(cart.filter(i => i.id !== item.id));
            } else {
              setCart(cart.map(i =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
              ));
            }
          }}
          className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="mx-2 w-6 text-center text-gray-700">{item.quantity}</span>
        <button
          onClick={() => {
            setCart(cart.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ));
          }}
          className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  // Calcular total do carrinho
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Função para finalizar a venda
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    // Adiciona os itens ao carrinho antes de finalizar
    try {
      // Primeiro, limpa o carrinho para evitar itens duplicados
      await cartService.clearCart();
      
      // Adiciona cada item ao carrinho
      for (const item of cart) {
        await cartService.addItem(item.id, item.quantity);
      }

      // Aqui você pode adicionar um modal para selecionar o método de pagamento
      // Por enquanto, vamos usar 'DINHEIRO' como padrão
      const paymentMethod = 'DINHEIRO'; // Você pode implementar um seletor de método de pagamento
      
      const result = await cartService.checkout(
        paymentMethod,  // método de pagamento
        null,           // customer_id (opcional)
        ''              // notes (opcional)
      );
      
      alert(`Venda finalizada com sucesso! Número da venda: ${result.sale_number}`);
      setCart([]);
      setShowCart(false);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert(`Erro ao finalizar venda: ${error.message || 'Tente novamente mais tarde.'}`);
    }
  };

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

              <div className="flex flex-col h-[calc(100%-60px)]">
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
                    <div className="overflow-y-auto flex-1 p-4">
                      {cart.map(renderCartItem)}
                    </div>
                    
                    <div className="border-t border-gray-100 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(cartTotal)}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={cart.length === 0}
                      >
                        <Check className="mr-2" size={18} />
                        Finalizar Venda
                      </button>
                      
                      {renderClearCartButton()}
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
    </div>
  );
};

export default PDVPage;
