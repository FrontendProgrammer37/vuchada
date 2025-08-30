import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import apiService from '../services/api';
import Modal from '../components/Modal';

const TodasVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtro, setFiltro] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    valorMinimo: '',
    valorMaximo: ''
  });
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    itensPorPagina: 10,
    total: 0
  });

  useEffect(() => {
    carregarVendas();
  }, [paginacao.pagina]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const skip = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      
      // Buscar vendas com paginação
      const vendas = await apiService.getSales({ 
        skip, 
        limit: paginacao.itensPorPagina 
      });
      
      // Atualizar estado
      setVendas(vendas);
      
      // Se precisar do total de itens para paginação, você pode precisar de um endpoint separado
      // ou ajustar a API para retornar o total junto com os dados
      // Por enquanto, vamos apenas ver se há mais itens do que o limite
      const temMaisItens = vendas.length === paginacao.itensPorPagina;
      setPaginacao(prev => ({
        ...prev,
        total: temMaisItens ? prev.total || vendas.length + 1 : vendas.length
      }));
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError(err.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro(prev => ({ ...prev, [name]: value }));
  };

  const aplicarFiltro = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
    carregarVendas();
  };

  const limparFiltro = () => {
    setFiltro({
      dataInicio: '',
      dataFim: '',
      status: '',
      valorMinimo: '',
      valorMaximo: ''
    });
    setPaginacao(prev => ({ ...prev, pagina: 1 }));
    carregarVendas();
  };

  const formatarData = (dataString) => {
    try {
      return new Date(dataString).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatarMoeda = (valor) => {
    // Verificar se o valor é válido
    if (valor === null || valor === undefined || isNaN(Number(valor))) {
      return 'Valor indisponível';
    }
    return `MT ${Number(valor).toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const verificarValorReal = (valor) => {
    return valor !== null && valor !== undefined && !isNaN(Number(valor));
  };

  const mudarPagina = (novaPagina) => {
    if (novaPagina < 1 || novaPagina > Math.ceil(paginacao.total / paginacao.itensPorPagina)) {
      return;
    }
    setPaginacao(prev => ({ ...prev, pagina: novaPagina }));
  };

  const exportarCSV = () => {
    // Implementação básica de exportação CSV
    const headers = ['ID', 'Valor', 'Data', 'Status'];
    const dadosCSV = vendas.map(venda => [
      venda.id,
      venda.total_amount,
      formatarData(venda.created_at),
      venda.status || 'concluída'
    ]);
    
    const conteudoCSV = [
      headers.join(','),
      ...dadosCSV.map(linha => linha.join(','))
    ].join('\n');
    
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const abrirDetalhesVenda = (venda) => {
    setSelectedVenda(venda);
    setIsModalOpen(true);
  };

  const formatarItensVenda = (itens) => {
    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return <p className="text-gray-500">Nenhum item encontrado</p>;
    }

    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-900 mb-2">Itens da Venda</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {itens.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item['product.nome'] || 'Produto não encontrado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarMoeda(item.unit_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatarMoeda(item.total_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl font-semibold text-gray-900">Todas as Vendas</h1>
          <p className="mt-1 text-sm text-gray-500">Histórico completo de vendas</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportarCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => document.getElementById('filtrosForm').classList.toggle('hidden')}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Filtros</span>
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div id="filtrosForm" className="bg-white shadow rounded-lg p-4 mb-6 hidden lg:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700">Data Início</label>
            <input
              type="date"
              id="dataInicio"
              name="dataInicio"
              value={filtro.dataInicio}
              onChange={handleFiltroChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700">Data Fim</label>
            <input
              type="date"
              id="dataFim"
              name="dataFim"
              value={filtro.dataFim}
              onChange={handleFiltroChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              value={filtro.status}
              onChange={handleFiltroChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="concluída">Concluída</option>
              <option value="cancelada">Cancelada</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              type="button"
              onClick={aplicarFiltro}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Aplicar Filtros
            </button>
            <button
              type="button"
              onClick={limparFiltro}
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View - Cards */}
      <div className="lg:hidden space-y-4">
        {!loading && !error && vendas.length === 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
            Nenhuma venda encontrada com os filtros atuais
          </div>
        )}
        
        {vendas.map((venda) => (
          <div key={venda.id} className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Venda #{venda.sale_number || venda.id}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatarData(venda.created_at)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  venda.status === 'concluída' ? 'bg-green-100 text-green-800' :
                  venda.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {venda.status || 'Pendente'}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Valor Total</p>
                  <p className="font-medium">{formatarMoeda(venda.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Itens</p>
                  <p className="font-medium">{venda.items?.length || 0}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => abrirDetalhesVenda(venda)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venda
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!loading && !error && vendas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhuma venda encontrada com os filtros atuais
                    </td>
                  </tr>
                ) : (
                  vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{venda.sale_number || venda.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatarData(venda.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatarMoeda(venda.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          venda.status === 'concluída' ? 'bg-green-100 text-green-800' :
                          venda.status === 'cancelada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venda.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => abrirDetalhesVenda(venda)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Ver detalhes"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {!loading && !error && vendas.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => mudarPagina(paginacao.pagina - 1)}
              disabled={paginacao.pagina === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                paginacao.pagina === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={() => mudarPagina(paginacao.pagina + 1)}
              disabled={paginacao.pagina * paginacao.itensPorPagina >= paginacao.total}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                paginacao.pagina * paginacao.itensPorPagina >= paginacao.total
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(paginacao.pagina - 1) * paginacao.itensPorPagina + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(paginacao.pagina * paginacao.itensPorPagina, paginacao.total)}
                </span>{' '}
                de <span className="font-medium">{paginacao.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => mudarPagina(paginacao.pagina - 1)}
                  disabled={paginacao.pagina === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    paginacao.pagina === 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Página {paginacao.pagina} de {Math.ceil(paginacao.total / paginacao.itensPorPagina)}
                </span>
                <button
                  onClick={() => mudarPagina(paginacao.pagina + 1)}
                  disabled={paginacao.pagina * paginacao.itensPorPagina >= paginacao.total}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    paginacao.pagina * paginacao.itensPorPagina >= paginacao.total
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Venda */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Detalhes da Venda #${selectedVenda?.sale_number || ''}`}
      >
        {selectedVenda && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Número da Venda</p>
                <p className="font-medium">{selectedVenda.sale_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">{formatarData(selectedVenda.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">
                  {selectedVenda.status === 'concluida' ? 'Concluída' : 
                   selectedVenda.status === 'cancelada' ? 'Cancelada' : 
                   selectedVenda.status || 'Pendente'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Método de Pagamento</p>
                <p className="font-medium">
                  {selectedVenda.payment_method === 'DINHEIRO' ? 'Dinheiro' :
                   selectedVenda.payment_method === 'CARTAO_POS' ? 'Cartão POS' :
                   selectedVenda.payment_method === 'TRANSFERENCIA' ? 'Transferência' :
                   selectedVenda.payment_method || 'Não especificado'}
                </p>
              </div>
            </div>

            {/* Resumo de valores */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Subtotal</p>
                  <p className="font-medium">{formatarMoeda(selectedVenda.subtotal || 0)}</p>
                </div>
                {selectedVenda.discount_amount > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Desconto</p>
                    <p className="font-medium text-red-600">-{formatarMoeda(selectedVenda.discount_amount || 0)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Impostos</p>
                  <p className="font-medium">{formatarMoeda(selectedVenda.tax_amount || 0)}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-gray-900">Total</p>
                  <p className="text-lg font-bold">{formatarMoeda(selectedVenda.total_amount || 0)}</p>
                </div>
              </div>
            </div>

            {/* Itens da venda */}
            {formatarItensVenda(selectedVenda.items || [])}

            {/* Notas adicionais */}
            {selectedVenda.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Observações</p>
                <p className="mt-1 text-sm text-gray-900">{selectedVenda.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TodasVendas;