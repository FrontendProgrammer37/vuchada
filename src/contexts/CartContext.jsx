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
  const [sessionId, setSessionId] = useState(() => {
    // Tenta obter o sessionId do localStorage, se não existir, gera um novo
    return localStorage.getItem('sessionId') || `sess_${Math.random().toString(36).substr(2, 9)}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Salva o sessionId no localStorage quando ele mudar
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  // Atualiza o estado do carrinho
  const updateCartState = (cartData) => {
    setCart({
      items: cartData.items || [],
      subtotal: cartData.subtotal || 0,
      tax_amount: cartData.tax_amount || 0,
      total: cartData.total || 0,
      itemCount: cartData.items ? cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0
    });
  };

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

  // Adicionar item ao carrinho
  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      await cartService.addItem(productId, quantity);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao adicionar item ao carrinho');
      console.error('Erro ao adicionar item:', err);
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
      console.error('Erro ao remover item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar quantidade de um item no carrinho
  const updateItemQuantity = async (productId, quantity) => {
    try {
      setLoading(true);
      await cartService.updateItemQuantity(productId, quantity);
      await loadCart();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar quantidade');
      console.error('Erro ao atualizar quantidade:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Limpar carrinho
  const clearCart = async () => {
    try {
      setLoading(true);
      await cartService.clearCart(sessionId);
      setCart({
        items: [],
        subtotal: 0,
        tax_amount: 0,
        total: 0,
        itemCount: 0
      });
    } catch (err) {
      setError(err.message || 'Erro ao limpar carrinho');
      console.error('Erro ao limpar carrinho:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Finalizar compra
  const checkout = async (paymentMethod, customerId = null, notes = '') => {
    try {
      setLoading(true);
      const result = await cartService.checkout(paymentMethod, customerId, notes);
      await clearCart(); // Limpa o carrinho após finalizar a compra
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao finalizar compra');
      console.error('Erro ao finalizar compra:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Valor do contexto
  const value = {
    cart,
    loading,
    error,
    sessionId,
    loadCart,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    checkout
  };

  return (
    <CartContext.Provider value={value}>
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
