import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart } from 'lucide-react';
import apiService from '../services/api';
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
    const initializePDV = async () => {
      try {
        setLoading(true);
        
        // 1. Limpar o carrinho existente
        try {
          await cartService.clearCart();
        } catch (error) {
          console.warn('Não foi possível limpar o carrinho:', error);
          // Continua mesmo se não conseguir limpar
        }
        
        // 2. Buscar produtos
        const productsData = await apiService.getProducts({ limit: 1000 });
        setProducts(productsData);
        
        // 3. Inicializar carrinho vazio
        setCart({
          items: [],
          subtotal: 0,
          total: 0,
          itemCount: 0
        });
        
      } catch (err) {
        console.error('Erro ao inicializar PDV:', err);
        setError('Erro ao carregar dados. Tente novamente mais tarde.');
        toast.error('Erro ao carregar o PDV');
      } finally {
        setLoading(false);
      }
    };

    initializePDV();
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
      // Add haptic feedback on mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
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
  const renderCartItem = (item) => {
    const unitPrice = parseFloat(item.unit_price || item.price || 0);
    const totalPrice = parseFloat(item.total_price || (unitPrice * item.quantity) || 0);
    
    // Tenta encontrar o produto completo na lista de produtos para obter o nome
    const product = products.find(p => p.id === (item.product_id || item.id));
    const productName = product?.name || item.product?.name || item.name || item.product_name || 'Produto sem nome';
    
    return (
      <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100">
        <div className="flex-1">
          <div className="font-medium text-gray-800">{productName}</div>
          <div className="text-sm text-gray-500">
            {`${item.quantity} × ${unitPrice.toFixed(2)} MTn`}
          </div>
        </div>
        <div className="font-medium text-gray-900">
          {totalPrice.toFixed(2)} MTn
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => updateCartItem(item.product_id || item.id, item.quantity - 1)}
            className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
            aria-label="Diminuir quantidade"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => updateCartItem(item.product_id || item.id, item.quantity + 1)}
            className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100"
            aria-label="Aumentar quantidade"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => removeFromCart(item.product_id || item.id)}
            className="text-red-500 hover:text-red-700 p-1 ml-2"
            aria-label="Remover item"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Renderizar produto na lista
  const renderProduct = (product) => (
    <div key={product.id} className="bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow active:scale-95">
      <h3 className="font-bold text-gray-800 text-sm sm:text-base">{product.name}</h3>
      <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">{product.description || 'Sem descrição'}</p>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold text-blue-600 text-sm sm:text-base">{formatCurrency(product.sale_price)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          aria-label={`Adicionar ${product.name} ao carrinho`}
        >
          <Plus size={18} className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );

  // Calcular total do carrinho
  const cartTotal = cart.total;
  const totalItems = cart.itemCount;

  return (
    <div className="relative min-h-screen pb-24 sm:pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Nova Venda</h1>
              <p className="text-sm text-gray-600 hidden sm:block">Selecione os produtos</p>
            </div>
            
            {/* Desktop cart button */}
            <button
              onClick={() => setShowCart(!showCart)}
              className="hidden sm:flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow"
              aria-label="Ver carrinho"
            >
              <ShoppingCart className="text-gray-700" size={20} />
              {totalItems > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
              <span className="font-medium">Ver Carrinho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map(renderProduct)}
          </div>
        )}
      </div>

      {/* Mobile Cart Button (fixed at bottom) */}
      {isMobile && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors z-20 flex items-center gap-2"
          aria-label="Ver carrinho"
        >
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      )}

      {/* Cart Panel */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${
          showCart ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowCart(false)}
      >
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg transform transition-transform duration-300 ${
            showCart ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Carrinho</h2>
              <button 
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Fechar carrinho"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
              {cart.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Seu carrinho está vazio</p>
                  <button 
                    onClick={() => setShowCart(false)}
                    className="mt-4 text-blue-600 font-medium"
                  >
                    Adicionar itens
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map(renderCartItem)}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(cartTotal)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Finalizar Venda
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVPage;
