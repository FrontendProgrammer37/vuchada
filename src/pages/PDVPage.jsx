import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart } from 'lucide-react';
import cartService from '../services/cartService';
import checkoutService from '../services/checkoutService';
import { toast } from 'react-toastify';

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
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0, itemCount: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Buscar produtos e carrinho ao carregar a página
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Buscar produtos
        const productsData = await apiService.getProducts({ limit: 1000 });
        setProducts(productsData);
        
        // Buscar carrinho atual
        await loadCart();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente mais tarde.');
        toast.error('Erro ao carregar dados do sistema');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Carregar carrinho do servidor
  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart();
      setCart({
        items: cartData.items || [],
        subtotal: cartData.subtotal || 0,
        total: cartData.total || 0,
        itemCount: cartData.item_count || 0
      });
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      toast.error('Erro ao carregar carrinho');
    }
  };

  // Adicionar item ao carrinho
  const addToCart = async (product) => {
    try {
      await cartService.addItem(product.id, 1);
      await loadCart(); // Recarrega o carrinho após adicionar item
      toast.success(`${product.name} adicionado ao carrinho`);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error('Erro ao adicionar item ao carrinho');
    }
  };

  // Atualizar quantidade de um item no carrinho
  const updateCartItem = async (productId, newQuantity) => {
    try {
      if (newQuantity < 1) {
        await cartService.removeItem(productId);
      } else {
        await cartService.updateItemQuantity(productId, newQuantity);
      }
      await loadCart();
    } catch (error) {
      console.error('Erro ao atualizar carrinho:', error);
      toast.error('Erro ao atualizar carrinho');
    }
  };

  // Remover item do carrinho
  const removeFromCart = async (productId) => {
    try {
      await cartService.removeItem(productId);
      await loadCart();
      toast.success('Item removido do carrinho');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Erro ao remover item do carrinho');
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    try {
      await cartService.clearCart();
      await loadCart();
      toast.success('Carrinho limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      toast.error('Erro ao limpar carrinho');
    }
  };

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.warning('Adicione itens ao carrinho antes de finalizar a venda');
      return;
    }

    setIsCheckingOut(true);
    
    try {
      // Aqui você pode adicionar mais lógica como seleção de cliente, forma de pagamento, etc.
      const saleData = {
        payment_method: 'DINHEIRO', // Exemplo - implementar seleção de forma de pagamento
        customer_id: null, // Implementar seleção de cliente se necessário
        notes: 'Venda realizada pelo PDV'
      };
      
      const result = await checkoutService.processCheckout(saleData);
      
      // Limpar carrinho após venda concluída
      await cartService.clearCart();
      await loadCart();
      
      toast.success(`Venda #${result.sale_number} finalizada com sucesso!`);
      
      // Aqui você pode redirecionar para o comprovante ou fazer outra ação
      console.log('Venda finalizada:', result);
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error(`Erro ao finalizar venda: ${error.message || 'Tente novamente'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Renderizar item do carrinho
  const renderCartItem = (item) => (
    <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100">
      <div className="flex-1">
        <div className="font-medium text-gray-800">{item.name}</div>
        <div className="text-sm text-gray-500">
          {formatCurrency(item.price)} × {item.quantity}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateCartItem(item.id, item.quantity - 1)}
          className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Diminuir quantidade"
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => updateCartItem(item.id, item.quantity + 1)}
          className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100"
          aria-label="Aumentar quantidade"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 p-1 ml-2"
          aria-label="Remover item"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );

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

  // Calcular total do carrinho
  const cartTotal = cart.total;
  const totalItems = cart.itemCount;

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
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(cartTotal)}
                        </span>
                      </div>
                      
                      <button
                        onClick={handleCheckout}
                        className={`w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-md font-medium flex items-center justify-center transition-colors ${
                          cart.items.length === 0 || isCheckingOut ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={cart.items.length === 0 || isCheckingOut}
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
                      
                      <button
                        onClick={clearCart}
                        className="mt-2 w-full bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-4 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
                      >
                        <X size={16} className="mr-1" />
                        Limpar Venda
                      </button>
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
