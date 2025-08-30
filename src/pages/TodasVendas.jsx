import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import salesService from '../services/salesService';

const TodasVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  }, [paginacao.pagina, filtro]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      const skip = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      
      // Construir parâmetros de filtro
      const params = {
        data_inicio: filtro.dataInicio || undefined,
        data_fim: filtro.dataFim || undefined,
        status: filtro.status || undefined,
        valor_minimo: filtro.valorMinimo || undefined,
        valor_maximo: filtro.valorMaximo || undefined
      };

      // Remover parâmetros undefined
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await salesService.listSales(skip, paginacao.itensPorPagina, params);
      
      // Se a resposta for um array, trata como paginação no cliente
      if (Array.isArray(response)) {
        setVendas(response);
        setPaginacao(prev => ({
          ...prev,
          total: response.length
        }));
      } else {
        // Se a resposta tiver estrutura de paginação do servidor
        setVendas(response.data || response.items || []);
        setPaginacao(prev => ({
          ...prev,
          total: response.total || response.count || 0
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError('Erro ao carregar as vendas. Tente novamente mais tarde.');
      setVendas([]);
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
  };

  const formatarData = (dataString) => {
    try {
      if (!dataString) return 'N/A';
      const date = new Date(dataString);
      return date.toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return 'Data inválida';
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || isNaN(Number(valor))) {
      return 'N/A';
    }
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  const mudarPagina = (novaPagina) => {
    if (novaPagina < 1 || novaPagina > Math.ceil(paginacao.total / paginacao.itensPorPagina)) {
      return;
    }
    setPaginacao(prev => ({ ...prev, pagina: novaPagina }));
  };

  const exportarCSV = () => {
    try {
      const headers = ['ID', 'Número', 'Data', 'Status', 'Total', 'Método de Pagamento'];
      const dadosCSV = vendas.map(venda => [
        venda.id,
        venda.sale_number || 'N/A',
        formatarData(venda.created_at),
        venda.status || 'concluída',
        venda.total_amount || '0',
        venda.payment_method || 'N/A'
      ]);
      
      const conteudoCSV = [
        headers.join(';'),
        ...dadosCSV.map(linha => linha.join(';'))
      ].join('\n');
      
      const blob = new Blob([`\ufeff${conteudoCSV}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `vendas_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Todas as Vendas</h1>
        <p className="mt-1 text-sm text-gray-500">Histórico completo de vendas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={exportarCSV}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </button>
              <button 
                type="button" 
                onClick={() => document.getElementById('filtrosForm').classList.toggle('hidden')}
                className="md:hidden inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </button>
            </div>
          </div>
          
          <form id="filtrosForm" onSubmit={aplicarFiltro} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700">Data Início</label>
                <input
                  type="date"
                  id="dataInicio"
                  name="dataInicio"
                  value={filtro.dataInicio}
                  onChange={handleFiltroChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  name="status"
                  value={filtro.status}
                  onChange={handleFiltroChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="pendente">Pendente</option>
                </select>
              </div>
              
              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Aplicar Filtros
                </button>
                <button
                  type="button"
                  onClick={limparFiltro}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Limpar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando vendas...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="mt-2 text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={carregarVendas}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tentar novamente
              </button>
            </div>
          ) : vendas.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma venda encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {venda.sale_number || `#${venda.id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(venda.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        venda.status === 'concluida' 
                          ? 'bg-green-100 text-green-800' 
                          : venda.status === 'cancelada' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {venda.status === 'concluida' ? 'Concluída' : 
                         venda.status === 'cancelada' ? 'Cancelada' : 
                         venda.status || 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatarMoeda(venda.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={`/vendas/${venda.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver detalhes
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginação */}
        {!loading && vendas.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => mudarPagina(paginacao.pagina - 1)}
                disabled={paginacao.pagina === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  paginacao.pagina === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => mudarPagina(paginacao.pagina + 1)}
                disabled={paginacao.pagina * paginacao.itensPorPagina >= paginacao.total}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  paginacao.pagina * paginacao.itensPorPagina >= paginacao.total ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
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
                      paginacao.pagina === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Página {paginacao.pagina} de {Math.ceil(paginacao.total / paginacao.itensPorPagina) || 1}
                  </span>
                  <button
                    onClick={() => mudarPagina(paginacao.pagina + 1)}
                    disabled={paginacao.pagina * paginacao.itensPorPagina >= paginacao.total}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      paginacao.pagina * paginacao.itensPorPagina >= paginacao.total ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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
      </div>
    </div>
  );
};

export default TodasVendas;