import { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    tax_amount: 0,
    total: 0,
    itemCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar carrinho do servidor
  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      updateCartState(cartData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar carrinho');
      console.error('Erro ao carregar carrinho:', err);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar estado local do carrinho
  const updateCartState = (cartData) => {
    setCart({
      ...cartData,
      itemCount: cartData.items.reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  // Adicionar item ao carrinho
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      await cartService.addItem(productId, quantity);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao adicionar item ao carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar quantidade de um item no carrinho
  const updateItemQuantity = async (productId, newQuantity) => {
    try {
      setLoading(true);
      await cartService.updateItemQuantity(productId, newQuantity);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar quantidade');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remover item do carrinho
  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      await cartService.removeItem(productId);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao remover item do carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart();
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao limpar carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verificar se um produto está no carrinho
  const isInCart = (productId) => {
    return cart.items.some(item => item.product_id === productId);
  };

  // Obter quantidade de um item no carrinho
  const getItemQuantity = (productId) => {
    const item = cart.items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  // Efeito para carregar o carrinho quando o componente é montado
  useEffect(() => {
    loadCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateItemQuantity,
        removeFromCart,
        clearCart,
        isInCart,
        getItemQuantity,
        loadCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar o contexto do carrinho
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};

export default CartContext;
