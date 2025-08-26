import { useState, useEffect } from 'react';
import { ShoppingCart, CreditCard, DollarSign, X, Trash2, Plus, Minus, Check, Loader2 } from 'lucide-react';
import ProductSearch from '../components/ProductSearch';
import { useCart } from '../contexts/CartContext';
import checkoutService from '../services/checkoutService';
import { toast } from 'react-toastify';

const PDVPage = () => {
  const {
    cart,
    loading: cartLoading,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    getItemQuantity
  } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [amountReceived, setAmountReceived] = useState('');
  const [saleNote, setSaleNote] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [saleComplete, setSaleComplete] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [customerId, setCustomerId] = useState('');

  // Adicionar item ao carrinho
  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, 1);
      toast.success(`${product.name} adicionado ao carrinho!`);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast.error(`Erro: ${error.message}`);
    }
  };

  // Finalizar venda
  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.warning('Adicione itens ao carrinho antes de finalizar');
      return;
    }

    if (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cart.total)) {
      toast.error('Valor recebido deve ser maior ou igual ao total');
      return;
    }

    try {
      setIsCheckingOut(true);
      
      const result = await checkoutService.processCheckout({
        payment_method: paymentMethod,
        amount_received: paymentMethod === 'dinheiro' ? parseFloat(amountReceived) : cart.total,
        notes: saleNote,
        customer_id: customerId || null,
      });
      
      setSaleDetails({
        id: result.id,
        sale_number: result.sale_number,
        total_amount: result.total_amount,
        payment_method: result.payment_method,
        created_at: result.created_at,
        change: result.change_amount
      });
      
      await clearCart();
      setSaleComplete(true);
      toast.success(`Venda #${result.sale_number} concluída!`);
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao processar o pagamento';
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Calcular troco
  const calculateChange = () => {
    if (!amountReceived) return 0;
    const received = parseFloat(amountReceived);
    return received > cart.total ? (received - cart.total).toFixed(2) : 0;
  };

  // Reiniciar venda
  const startNewSale = () => {
    setSaleComplete(false);
    setSaleDetails(null);
    setAmountReceived('');
    setSaleNote('');
    setCustomerId('');
  };

  // Renderizar itens do carrinho
  const renderCartItems = () => {
    if (cart.items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2">Seu carrinho está vazio</p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-96">
        <ul className="divide-y divide-gray-200">
          {cart.items.map((item) => (
            <li key={item.product_id} className="py-3 px-2">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.unit_price)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    disabled={cartLoading}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    disabled={cartLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    className="ml-2 p-1 text-red-500 hover:text-red-700"
                    title="Remover item"
                    disabled={cartLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Renderizar resumo da venda
  const renderOrderSummary = () => (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Taxas:</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.tax_amount || 0)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
          <span>Total:</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.total)}
          </span>
        </div>
      </div>
    </div>
  );

  // Renderizar formulário de pagamento
  const renderPaymentForm = () => (
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Forma de Pagamento
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          disabled={isCheckingOut || cartLoading}
        >
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao_credito">Cartão de Crédito</option>
          <option value="cartao_debito">Cartão de Débito</option>
          <option value="pix">PIX</option>
        </select>
      </div>

      {paymentMethod === 'dinheiro' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor Recebido
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">R$</span>
            </div>
            <input
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0,00"
              step="0.01"
              min={cart.total}
              disabled={isCheckingOut || cartLoading}
            />
          </div>
          {amountReceived && parseFloat(amountReceived) > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Troco: {calculateChange()}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          rows={2}
          value={saleNote}
          onChange={(e) => setSaleNote(e.target.value)}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
          placeholder="Opcional"
          disabled={isCheckingOut || cartLoading}
        />
      </div>

      <button
        onClick={handleCheckout}
        disabled={isCheckingOut || cartLoading || cart.items.length === 0}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isCheckingOut || cartLoading || cart.items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isCheckingOut ? 'Finalizando...' : 'Finalizar Venda'}
      </button>
    </div>
  );

  // Renderizar confirmação de venda
  const renderSaleComplete = () => (
    <div className="text-center py-8">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <Check className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="mt-3 text-lg font-medium text-gray-900">Venda Concluída!</h3>
      <p className="mt-2 text-sm text-gray-500">
        Número da venda: {saleDetails?.sale_number}
      </p>
      <p className="mt-1 text-lg font-bold">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(saleDetails?.total_amount || 0)}
      </p>
      <div className="mt-6">
        <button
          onClick={startNewSale}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Nova Venda
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ponto de Venda</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de busca de produtos */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Buscar Produtos</h2>
              <ProductSearch onAddToCart={handleAddToCart} />
            </div>
          </div>

          {/* Painel do carrinho */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Carrinho</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {saleComplete ? (
                renderSaleComplete()
              ) : (
                <>
                  {cartLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      {renderCartItems()}
                      {cart.items.length > 0 && (
                        <>
                          {renderOrderSummary()}
                          {renderPaymentForm()}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVPage;
