import { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';
import api from '../services/api';

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
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'));

  // Initialize session ID if not exists
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  // Update API service with current session ID
  useEffect(() => {
    if (sessionId) {
      // The session ID is now automatically handled by the API service
      loadCart();
    }
  }, [sessionId]);

  // Carregar carrinho do servidor
  const loadCart = async () => {
    if (!sessionId) return;
    
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
      items: cartData.items || [],
      subtotal: cartData.subtotal || 0,
      tax_amount: cartData.tax_amount || 0,
      total: cartData.total || 0,
      itemCount: (cartData.items || []).reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  // Adicionar item ao carrinho
  const addToCart = async (productId, quantity = 1) => {
    if (!sessionId) return;
    
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

  // Atualizar quantidade de um item
  const updateItemQuantity = async (productId, newQuantity) => {
    if (!sessionId) return;
    
    try {
      if (newQuantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      
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
    if (!sessionId) return;
    
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
    if (!sessionId) return;
    
    try {
      setLoading(true);
      await cartService.clearCart();
      updateCartState({ items: [], subtotal: 0, tax_amount: 0, total: 0 });
    } catch (err) {
      setError(err.message || 'Erro ao limpar carrinho');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Finalizar compra
  const checkout = async (paymentMethod, amountReceived = 0) => {
    if (!sessionId) return null;
    
    try {
      setLoading(true);
      const saleData = {
        items: cart.items.map(item => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity,
          unit_price: item.price || item.unit_price,
          total_price: (item.price || item.unit_price) * item.quantity
        })),
        payment_method: paymentMethod,
        amount_received: parseFloat(amountReceived) || cart.total,
        total_amount: cart.total,
        change: parseFloat(amountReceived) - cart.total
      };
      
      // Clear cart on successful checkout
      await clearCart();
      return saleData;
    } catch (err) {
      setError(err.message || 'Erro ao finalizar compra');
      throw err;
    } finally {
      setLoading(false);
    }
  };

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
        checkout,
        reloadCart: loadCart
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
