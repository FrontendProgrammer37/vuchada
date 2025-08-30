import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  
  // Inicializa o sessionId a partir do localStorage ou gera um novo
  const [sessionId, setSessionId] = useState(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    return savedSessionId || `sess_${Math.random().toString(36).substr(2, 9)}`;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Salva o sessionId no localStorage sempre que ele mudar
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  // Atualiza o estado do carrinho
  const updateCartState = useCallback((cartData) => {
    setCart({
      items: cartData.items || [],
      subtotal: cartData.subtotal || 0,
      tax_amount: cartData.tax_amount || 0,
      total: cartData.total || 0,
      itemCount: cartData.items ? cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0
    });
  }, []);

  // Carregar carrinho do servidor
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      updateCartState(cartData);
    } catch (err) {
      setError(err.message || 'Erro ao carregar carrinho');
      console.error('Erro ao carregar carrinho:', err);
      // Se o carrinho não existir, limpa o estado local
      updateCartState({ items: [], subtotal: 0, tax_amount: 0, total: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [updateCartState]);

  // Adicionar item ao carrinho
  const addToCart = useCallback(async (productId, quantity = 1) => {
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
  }, [loadCart]);

  // Remover item do carrinho
  const removeFromCart = useCallback(async (productId) => {
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
  }, [loadCart]);

  // Atualizar quantidade de um item no carrinho
  const updateItemQuantity = useCallback(async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      
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
  }, [loadCart, removeFromCart]);

  // Limpar carrinho
  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      await cartService.clearCart(sessionId);
      updateCartState({
        items: [],
        subtotal: 0,
        tax_amount: 0,
        total: 0,
        itemCount: 0
      });
    } catch (err) {
      // Se o carrinho já estiver vazio, apenas atualiza o estado local
      if (err.response?.status === 404) {
        updateCartState({
          items: [],
          subtotal: 0,
          tax_amount: 0,
          total: 0,
          itemCount: 0
        });
        return;
      }
      
      setError(err.message || 'Erro ao limpar carrinho');
      console.error('Erro ao limpar carrinho:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, updateCartState]);

  // Finalizar compra
  const checkout = useCallback(async (paymentMethod, customerId = null, notes = '') => {
    try {
      setLoading(true);
      const result = await cartService.checkout(paymentMethod, customerId, notes);
      // Limpa o carrinho após finalizar a compra
      await clearCart();
      return result;
    } catch (err) {
      setError(err.message || 'Erro ao finalizar compra');
      console.error('Erro ao finalizar compra:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearCart]);

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
