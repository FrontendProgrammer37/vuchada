import { X, CheckCircle, Loader2 } from 'lucide-react';

const ModalPagamento = ({
  isOpen,
  onClose,
  total,
  formaPagamento,
  setFormaPagamento,
  valorRecebido,
  setValorRecebido,
  troco,
  onFinalizarVenda,
  processandoVenda,
  vendaConcluida,
  vendaInfo,
  metodosPagamento = []
}) => {
  if (!isOpen) return null;

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Verificar se o método de pagamento requer entrada de valor
  const requerValorRecebido = formaPagamento === 'DINHEIRO';
  const valorMinimo = requerValorRecebido ? total : 0;
  
  // Obter o label do método de pagamento selecionado
  const getMetodoPagamentoLabel = (value) => {
    const metodo = metodosPagamento.find(m => m.value === value);
    return metodo ? metodo.label : value;
  };

  // Verificar se o botão de finalizar deve estar desabilitado
  const isFinalizarDisabled = 
    processandoVenda || 
    (requerValorRecebido && (!valorRecebido || Number(valorRecebido) < total));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {!vendaConcluida && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            disabled={processandoVenda}
          >
            <X size={24} />
          </button>
        )}

        <h2 className="text-2xl font-bold mb-6 text-center">
          {vendaConcluida ? 'Venda Concluída!' : 'Finalizar Venda'}
        </h2>
        
        {!vendaConcluida ? (
          <>
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-xl font-bold text-center text-blue-800">
                  {formatarMoeda(total)}
                </p>
                <p className="text-sm text-center text-blue-600 mt-1">Total a pagar</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {metodosPagamento.map((metodo) => (
                    <button
                      key={metodo.value}
                      type="button"
                      onClick={() => setFormaPagamento(metodo.value)}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center ${
                        formaPagamento === metodo.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium">{metodo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {requerValorRecebido && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Recebido
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">MT</span>
                    </div>
                    <input
                      type="number"
                      min={total}
                      step="0.01"
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={formatarMoeda(total)}
                      disabled={processandoVenda}
                    />
                  </div>
                  {troco > 0 && (
                    <p className="mt-2 text-green-600 font-medium">
                      Troco: {formatarMoeda(troco)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={processandoVenda}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onFinalizarVenda}
                disabled={isFinalizarDisabled}
                className={`px-4 py-2 rounded-md text-white ${
                  isFinalizarDisabled
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processandoVenda ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Processando...
                  </div>
                ) : (
                  `Finalizar com ${getMetodoPagamentoLabel(formaPagamento)}`
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Venda Concluída com Sucesso!</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-4 mb-6 text-left">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Número:</span>
                <span className="font-medium">{vendaInfo?.sale_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Método:</span>
                <span className="font-medium">{getMetodoPagamentoLabel(vendaInfo?.payment_method)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold">{formatarMoeda(vendaInfo?.total_amount || 0)}</span>
              </div>
              {vendaInfo?.payment_method === 'DINHEIRO' && (
                <>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Valor Recebido:</span>
                    <span>{formatarMoeda(vendaInfo?.amount_paid || 0)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Troco:</span>
                    <span className="font-medium text-green-600">
                      {formatarMoeda(vendaInfo?.change_amount || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalPagamento;
