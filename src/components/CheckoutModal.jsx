import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { PAYMENT_METHODS } from '../services/cartService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const CheckoutModal = ({ isOpen, onClose, onCheckoutSuccess }) => {
  const { cart, clearCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (cart.items.length === 0) {
      toast.error('O carrinho está vazio');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Aqui você precisará implementar a lógica de checkout
      // usando o cartService.checkout()
      const result = await cartService.checkout(
        paymentMethod,
        customerId || null,
        notes
      );
      
      toast.success('Venda finalizada com sucesso!');
      await clearCart();
      onCheckoutSuccess(result);
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Finalizar Venda</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
                required
              >
                {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {formatPaymentMethod(value)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID do Cliente (Opcional)
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
                placeholder="ID do cliente (se aplicável)"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                disabled={isProcessing}
                placeholder="Alguma observação sobre a venda?"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Taxas:</span>
                <span className="font-medium">{formatCurrency(cart.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(cart.total)}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcessing || cartLoading || cart.items.length === 0}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Função auxiliar para formatar o valor monetário
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'MZN'
  }).format(value || 0);
};

// Função para formatar o método de pagamento para exibição
const formatPaymentMethod = (method) => {
  const methods = {
    [PAYMENT_METHODS.CASH]: 'Dinheiro',
    [PAYMENT_METHODS.MPESA]: 'M-Pesa',
    [PAYMENT_METHODS.EMOLA]: 'Emola',
    [PAYMENT_METHODS.CREDIT_CARD]: 'Cartão POS',
    [PAYMENT_METHODS.BANK_TRANSFER]: 'Transferência Bancária',
    [PAYMENT_METHODS.MILLENNIUM]: 'Millennium BIM',
    [PAYMENT_METHODS.BCI]: 'BCI',
    [PAYMENT_METHODS.STANDARD_BANK]: 'Standard Bank',
    [PAYMENT_METHODS.ABSA_BANK]: 'Absa Bank',
    [PAYMENT_METHODS.LETSHEGO]: 'Letshego',
    [PAYMENT_METHODS.MYBUCKS]: 'MyBucks'
  };
  
  return methods[method] || method;
};

export default CheckoutModal;
