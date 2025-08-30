import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart, CreditCard } from 'lucide-react';
import apiService from '../services/api';
import CheckoutModal from '../components/CheckoutModal';
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
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    itemCount: 0
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(!isMobile);
  const [showCheckout, setShowCheckout] = useState(false);

  // Calcular totais do carrinho
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Aqui você pode adicionar cálculo de impostos se necessário
    const tax_amount = subtotal * 0.16; // Exemplo de IVA 16%
    const total = subtotal + tax_amount;
    
    return {
      subtotal,
      tax_amount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  // Atualizar carrinho e calcular totais
  const updateCart = (newItems) => {
    const totals = calculateTotals(newItems);
    setCart({
      items: newItems,
      ...totals
    });
  };

  // Buscar produtos da API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
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
    const existingItem = cart.items.find(item => item.id === product.id);
    let newItems;
    
    if (existingItem) {
      newItems = cart.items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newItems = [...cart.items, { ...product, quantity: 1 }];
    }
    
    updateCart(newItems);
    
    // Feedback visual ao adicionar item
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  // Remover item do carrinho
  const removeFromCart = (productId) => {
    const newItems = cart.items.filter(item => item.id !== productId);
    updateCart(newItems);
  };

  // Atualizar quantidade de um item no carrinho
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const newItems = cart.items.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    updateCart(newItems);
  };

  // Limpar carrinho
  const clearCart = () => {
    updateCart([]);
  };

  // Finalizar venda
  const handleCheckoutSuccess = (result) => {
    // Aqui você pode adicionar lógica adicional após o checkout
    console.log('Venda finalizada:', result);
    // Limpar carrinho após venda finalizada
    clearCart();
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* Lista de Produtos */}
      <div className={`${showCart ? 'hidden lg:block' : 'block'} w-full lg:w-2/3 p-4 overflow-y-auto`}>
        <h1 className="text-2xl font-bold mb-6">Ponto de Venda</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <div className="h-32 bg-gray-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-blue-600 font-bold mt-1">{formatCurrency(product.price)}</p>
                  {product.stock_quantity > 0 ? (
                    <span className="text-xs text-green-600">Em estoque: {product.stock_quantity}</span>
                  ) : (
                    <span className="text-xs text-red-600">Fora de estoque</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carrinho de Compras */}
      <div className={`${showCart ? 'block' : 'hidden lg:block'} w-full lg:w-1/3 bg-white border-l border-gray-200 flex flex-col h-screen`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">Carrinho</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => clearCart()}
              className="text-red-500 hover:text-red-700 text-sm"
              disabled={cart.items.length === 0}
            >
              Limpar
            </button>
            <button 
              onClick={() => setShowCart(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">Seu carrinho está vazio</p>
              <p className="text-sm">Adicione itens para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-blue-600 font-bold">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(item.id);
                      }}
                      className="text-red-500 p-1 hover:bg-red-50 rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Impostos:</span>
            <span className="font-medium">{formatCurrency(cart.tax_amount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3 mb-4">
            <span>Total:</span>
            <span className="text-blue-600">{formatCurrency(cart.total)}</span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.items.length === 0}
            className={`w-full flex items-center justify-center py-3 px-4 rounded-md text-white font-medium ${
              cart.items.length === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* Botão flutuante para mostrar carrinho em mobile */}
      <button 
        onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {cart.itemCount}
          </span>
        )}
      </button>

      {/* Modal de Checkout */}
      <CheckoutModal 
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </div>
  );
};

export default PDVPage;
