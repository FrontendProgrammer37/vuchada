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
  const [weightInput, setWeightInput] = useState({
    isOpen: false,
    product: null,
    initialWeight: '0.100',
    isEditing: false
  });

  // Format weight for display (e.g., 1.500 kg)
  const formatWeight = (weight) => {
    const value = parseFloat(weight);
    return isNaN(value) ? '0.000 kg' : `${value.toFixed(3).replace(/\.?0+$/, '')} kg`;
  };

  // Calculate price for weight-based items
  const calculateWeightedPrice = (item) => {
    if (!item.is_weight_based) return item.price * item.quantity;
    return item.price * item.quantity; // price is per kg, quantity is in kg
  };

  // Open weight input dialog
  const openWeightInput = (product, isEditing = false, initialWeight = '0.100') => {
    setWeightInput({
      isOpen: true,
      product,
      initialWeight,
      isEditing
    });
  };

  // Close weight input dialog
  const closeWeightInput = () => {
    setWeightInput({
      isOpen: false,
      product: null,
      initialWeight: '0.100',
      isEditing: false
    });
  };

  // Handle weight confirmation
  const handleWeightConfirm = async (weight) => {
    if (!weightInput.product) return;
    
    try {
      setLoading(true);
      const { product, isEditing } = weightInput;
      
      if (isEditing) {
        await updateItemQuantity(product.id, weight);
      } else {
        await addToCart(product.id, weight, product.is_weight_based);
      }
    } catch (err) {
      setError(err.message || 'Erro ao processar item por peso');
      throw err;
    } finally {
      setLoading(false);
      closeWeightInput();
    }
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
  const addToCart = async (productId, quantity = 1, isWeightBased = false) => {
    try {
      setLoading(true);
      // Send isWeightBased flag to the backend if needed
      await cartService.addItem(productId, quantity, isWeightBased);
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
      updateCartState({ items: [], subtotal: 0, tax_amount: 0, total: 0 });
    } catch (err) {
      setError(err.message || 'Erro ao limpar carrinho');
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

  // Carregar carrinho ao montar o componente
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
        checkout,
        isInCart,
        getItemQuantity,
        loadCart,
        formatWeight,
        openWeightInput,
        closeWeightInput,
        weightInput,
        handleWeightConfirm
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
