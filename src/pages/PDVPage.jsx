import { useState, useEffect } from 'react';
import { Plus, Minus, X, Check, ShoppingCart, Scale, Trash2 } from 'lucide-react';
import apiService from '../services/api';
import cartService from '../services/cartService';
import checkoutService from '../services/checkoutService';
import { toast } from 'react-toastify';
import WeightSaleModal from '../components/WeightSaleModal';

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
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          total: 0
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
      setCart(cartData);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      toast.error('Erro ao carregar carrinho');
    }
  };

  // Adicionar item ao carrinho
  const addToCart = async (product, options = {}) => {
    try {
      const { isWeightSale = false, weightInKg = 1, customPrice = null } = options;
      
      const cartItem = {
        product_id: product.id,
        quantity: 1,
        ...(isWeightSale && {
          is_weight_sale: true,
          weight_kg: weightInKg,
          price: customPrice || product.price * weightInKg
        })
      };

      await cartService.addItem(cartItem);
      
      // Atualizar o carrinho após adicionar o item
      const updatedCart = await cartService.getCart();
      setCart(updatedCart);
      
      toast.success('Item adicionado ao carrinho!');
    } catch (error) {
      console.error('Erro ao adicionar item ao carrinho:', error);
      toast.error(error.message || 'Erro ao adicionar item ao carrinho');
    }
  };

  // Confirmar venda por peso
  const handleConfirmWeightSale = async (saleData) => {
    try {
      await addToCart(selectedProduct, {
        isWeightSale: true,
        weightInKg: saleData.weightInKg,
        customPrice: saleData.customPrice
      });
      setShowWeightModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Erro ao processar venda por peso:', error);
      toast.error('Erro ao processar venda por peso');
    }
  };

  // Atualizar quantidade de um item no carrinho
  const updateCartItem = async (productId, newQuantity, isWeightSale) => {
    try {
      const product = products.find(p => p.id === productId);
      const cartItem = cart.items.find(item => item.product_id === productId);

      if (!product || !cartItem) return;

      // Se for um produto por peso, não permitir aumentar a quantidade
      if (isWeightSale) {
        toast.info('Para alterar a quantidade de um produto vendido por peso, remova e adicione novamente com o peso desejado');
        return;
      }

      // Se for um produto normal, adicionar mais uma unidade
      if (newQuantity > 0) {
        await cartService.addItem(productId, 1);
      } else {
        // Se a nova quantidade for zero ou negativa, remover o item
        await cartService.removeItem(productId);
      }
      
      await loadCart();
    } catch (error) {
      console.error('Erro ao atualizar carrinho:', error);
      toast.error(error.message || 'Erro ao atualizar carrinho');
    }
  };

  // Remover item do carrinho
  const removeFromCart = async (productId, isWeightSale) => {
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
    }
  };

  // Renderizar produto na lista
  const renderProduct = (product) => (
    <div key={product.id} className="flex flex-col h-full bg-white rounded-lg shadow p-4 hover:shadow-md transition-all border border-gray-100">
      {/* Cabeçalho com nome e preço */}
      <div className="flex justify-between items-start mb-2 min-h-[3.5rem]">
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 flex-1 pr-2">{product.name}</h3>
        <span className="font-bold text-blue-600 whitespace-nowrap text-sm">
          {formatCurrency(product.price)}
        </span>
      </div>
      
      {/* Descrição */}
      <div className="mb-3 min-h-[2.5rem]">
        <p className="text-gray-600 text-xs line-clamp-2">
          {product.description || 'Sem descrição'}
        </p>
      </div>
      
      {/* Badge de venda por peso */}
      {product.venda_por_peso && (
        <div className="mb-3">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Venda por peso
          </span>
        </div>
      )}
      
      {/* Botão de ação */}
      <div className="mt-auto">
        <button
          onClick={() => {
            if (product.venda_por_peso) {
              setSelectedProduct(product);
              setShowWeightModal(true);
            } else {
              addToCart(product);
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
        >
          {product.venda_por_peso ? (
            <>
              <Scale className="w-4 h-4 mr-1" />
              Pesar
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-1" />
              Adicionar
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ponto de Venda</h1>
        <button 
          onClick={() => setShowCart(!showCart)} 
          className="lg:hidden bg-blue-600 text-white p-2 rounded-md"
        >
          {showCart ? (
            <X className="w-5 h-5" />
          ) : (
            <ShoppingCart className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p>{error}</p>
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
              {/* Cabeçalho do carrinho */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Carrinho de Compras</h2>
                <button 
                  onClick={() => setShowCart(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Itens do carrinho */}
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                {cart.items.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Seu carrinho está vazio</p>
                ) : (
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={`${item.product_id}-${item.is_weight_sale ? 'weight' : 'regular'}`} 
                           className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            {item.is_weight_sale && (
                              <p className="text-xs text-gray-500">
                                {item.weight_kg} kg × {formatCurrency(item.price / item.weight_kg)}/kg
                              </p>
                            )}
                          </div>
                          <span className="font-medium">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateCartItem(item.product_id, item.quantity - 1, item.is_weight_sale)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartItem(item.product_id, item.quantity + 1, item.is_weight_sale)}
                              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.product_id, item.is_weight_sale)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Resumo do pedido */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-lg text-blue-600">{formatCurrency(cart.total)}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  disabled={cart.items.length === 0}
                  className={`w-full py-3 px-4 rounded-md font-medium text-white ${cart.items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Finalizar Venda
                </button>
                
                {cart.items.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="w-full mt-2 py-2 px-4 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Limpar Carrinho
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de venda por peso */}
      <WeightSaleModal
        product={selectedProduct}
        isOpen={showWeightModal}
        onClose={() => {
          setShowWeightModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleConfirmWeightSale}
      />
    </div>
  );
};

export default PDVPage;
