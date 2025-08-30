import { useState, useEffect } from 'react';
import { Plus, Minus, X, ShoppingCart, Search, DollarSign, User, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import cartService from '../services/cartService';
import apiService from '../services/api';

// Format currency in MZN
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const PDV2 = () => {
  // State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [categories, setCategories] = useState([{ id: 'todos', name: 'Todos' }]);

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products
        const productsData = await apiService.request('/products');
        setProducts(productsData);

        // Extract unique categories
        const uniqueCategories = [...new Set(productsData.map(p => p.category))]
          .filter(cat => cat) // Remove undefined/null categories
          .map((cat, index) => ({ id: cat.toLowerCase(), name: cat }));
        
        setCategories([{ id: 'todos', name: 'Todos' }, ...uniqueCategories]);
        
        // Load cart
        await loadCart();
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Falha ao carregar os dados. Tente novamente.');
        toast.error('Erro ao carregar os dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load cart from service
  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error('Error loading cart:', err);
      toast.error('Erro ao carregar o carrinho');
    }
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'todos' || 
                          product.category?.toLowerCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Add product to cart
  const handleAddToCart = async (product) => {
    try {
      await cartService.addItem(product.id, 1);
      await loadCart();
      toast.success(`${product.name} adicionado ao carrinho`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = async (productId) => {
    try {
      await cartService.removeItem(productId);
      await loadCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
      toast.error('Erro ao remover item do carrinho');
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await cartService.updateItemQuantity(productId, newQuantity);
      await loadCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
      toast.error('Erro ao atualizar quantidade');
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.warning('Adicione itens ao carrinho primeiro');
      return;
    }

    try {
      // You can implement payment method selection here
      await cartService.checkout({
        payment_method: 'DINHEIRO', // Default to cash
        customer_id: null,
        notes: ''
      });
      
      toast.success('Venda concluída com sucesso!');
      await loadCart(); // Refresh cart
    } catch (err) {
      console.error('Error during checkout:', err);
      toast.error('Erro ao finalizar venda');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">PDV</h1>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-blue-700 px-4 py-2 rounded-lg hover:bg-blue-800 transition">
              <User size={20} />
              <span>Operador</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Search and Categories */}
          <div className="mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <div className="h-32 bg-gray-200 flex items-center justify-center">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="text-gray-400" size={40} />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 truncate">{product.name}</h3>
                  <p className="text-blue-600 font-bold">{formatCurrency(product.price)}</p>
                  {product.stock !== undefined && (
                    <p className="text-sm text-gray-500">
                      Estoque: {product.stock}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white border-l flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <ShoppingCart className="mr-2" size={20} />
              Carrinho ({cart.items.length})
            </h2>
            <button 
              onClick={() => cart.items.length > 0 && handleCheckout()}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg ${
                cart.items.length > 0 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={cart.items.length === 0}
            >
              <DollarSign size={16} />
              <span>Finalizar</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">
                <ShoppingCart className="mx-auto mb-2" size={40} />
                <p>Seu carrinho está vazio</p>
                <p className="text-sm">Adicione itens para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-blue-600 font-semibold">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-1 text-gray-500 hover:text-red-500"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      >
                        <Minus size={16} />
                      </button>
                      
                      <span className="w-8 text-center">{item.quantity}</span>
                      
                      <button 
                        className="p-1 text-gray-500 hover:text-green-500"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      >
                        <Plus size={16} />
                      </button>
                      
                      <button 
                        className="p-1 text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveFromCart(item.product_id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(cart.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-blue-600">{formatCurrency(cart.total || 0)}</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={cart.items.length === 0}
              className={`w-full mt-4 py-3 rounded-lg font-semibold ${
                cart.items.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDV2;
