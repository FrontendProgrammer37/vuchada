import { useState } from 'react';
import { ShoppingCart, CreditCard, DollarSign, X, Trash2, Plus, Minus, Check, Loader2, User } from 'lucide-react';
import ProductSearch from '../components/ProductSearch';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

const PDVPage = () => {
  const {
    cart,
    loading: cartLoading,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    checkout,
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
      
      const result = await checkout(paymentMethod, customerId || null, saleNote);
      
      setSaleDetails({
        id: result.id,
        sale_number: result.sale_number,
        total_amount: result.total_amount,
        payment_method: result.payment_method,
        created_at: result.created_at,
        change: paymentMethod === 'dinheiro' ? calculateChange() : 0
      });
      
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
              <div className="mt-1 text-right text-sm font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.total_price)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Renderizar resumo do pedido
  const renderOrderSummary = () => {
    if (cart.items.length === 0) return null;

    return (
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex justify-between py-1">
          <span>Subtotal:</span>
          <span className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.subtotal)}
          </span>
        </div>
        <div className="flex justify-between py-1 text-sm text-gray-600">
          <span>Taxas:</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.tax_amount || 0)}
          </span>
        </div>
        <div className="flex justify-between py-2 font-bold border-t border-gray-200 mt-2 pt-2">
          <span>Total:</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.total)}
          </span>
        </div>
      </div>
    );
  };

  // Renderizar formulário de pagamento
  const renderPaymentForm = () => {
    if (cart.items.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Forma de Pagamento</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {['dinheiro', 'credito', 'debito', 'pix'].map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`flex items-center justify-center p-3 border rounded-md ${
                paymentMethod === method
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {method === 'dinheiro' && <DollarSign className="h-5 w-5 mr-2" />}
              {method === 'credito' && <CreditCard className="h-5 w-5 mr-2" />}
              {method === 'debito' && <CreditCard className="h-5 w-5 mr-2" />}
              {method === 'pix' && <span className="mr-2">PIX</span>}
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>

        {paymentMethod === 'dinheiro' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Recebido
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">R$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min={cart.total}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="0,00"
              />
            </div>
            {amountReceived && parseFloat(amountReceived) < cart.total && (
              <p className="mt-1 text-sm text-red-600">
                Valor insuficiente. Faltam {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(cart.total - parseFloat(amountReceived))}
              </p>
            )}
            {amountReceived && parseFloat(amountReceived) >= cart.total && (
              <p className="mt-1 text-sm text-green-600">
                Troco: {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(calculateChange())}
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente (opcional)
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
              placeholder="ID do cliente"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            rows={2}
            value={saleNote}
            onChange={(e) => setSaleNote(e.target.value)}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Notas sobre a venda..."
          />
        </div>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={isCheckingOut || cartLoading || cart.items.length === 0 || 
                   (paymentMethod === 'dinheiro' && (!amountReceived || parseFloat(amountReceived) < cart.total))}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Processando...
            </>
          ) : (
            `Finalizar Venda (${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(cart.total)})`
          )}
        </button>
      </div>
    );
  };

  // Renderizar recibo
  const renderReceipt = () => {
    if (!saleComplete || !saleDetails) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="mt-3 text-lg font-medium text-gray-900">Venda Concluída!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Nº da venda: {saleDetails.sale_number}
          </p>
        </div>

        <div className="border-t border-b border-gray-200 py-4 my-4">
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Data/Hora:</span>
            <span className="font-medium">
              {new Date(saleDetails.created_at).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-600">Forma de pagamento:</span>
            <span className="font-medium capitalize">
              {saleDetails.payment_method}
            </span>
          </div>
          {saleDetails.payment_method === 'dinheiro' && saleDetails.change > 0 && (
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Troco:</span>
              <span className="font-medium text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(saleDetails.change)}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between text-lg font-bold mt-4 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(saleDetails.total_amount)}
          </span>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={startNewSale}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nova Venda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ponto de Venda (PDV)</h1>
      
      {saleComplete ? (
        renderReceipt()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Busca de Produtos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Buscar Produtos</h2>
              <ProductSearch 
                onSelectProduct={handleAddToCart} 
                isInCart={isInCart}
                getItemQuantity={getItemQuantity}
              />
            </div>
          </div>

          {/* Painel do Carrinho */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Carrinho de Compras
                  {cart.itemCount > 0 && ` (${cart.itemCount} itens)`}
                </h2>
              </div>
              
              <div className="p-4">
                {renderCartItems()}
                {renderOrderSummary()}
                {renderPaymentForm()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDVPage;
