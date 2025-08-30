import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import salesService from '../services/salesService';

// Componente para exibir o status da venda
const StatusBadge = ({ status }) => {
  const statusConfig = {
    concluida: { bg: 'bg-green-100 text-green-800', label: 'Concluída' },
    paga: { bg: 'bg-blue-100 text-blue-800', label: 'Paga' },
    pendente: { bg: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
    cancelada: { bg: 'bg-red-100 text-red-800', label: 'Cancelada' },
    reembolsada: { bg: 'bg-purple-100 text-purple-800', label: 'Reembolsada' },
  };

  const config = statusConfig[status] || { bg: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
      {config.label}
    </span>
  );
};

// Componente para exibir o método de pagamento
const PaymentMethod = ({ method }) => {
  const methods = {
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de Crédito',
    CARTAO_DEBITO: 'Cartão de Débito',
    PIX: 'PIX',
    TRANSFERENCIA: 'Transferência',
  };

  return <span>{methods[method] || method}</span>;
};

const TodasVendas = () => {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado de paginação
  const [paginacao, setPaginacao] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filtros
  const [filtros, setFiltros] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Carregar vendas
  const carregarVendas = async (pagina = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagina,
        limit: paginacao.limit,
        ...(filtros.status && { status: filtros.status }),
        ...(filtros.startDate && { start_date: filtros.startDate }),
        ...(filtros.endDate && { end_date: filtros.endDate }),
        ...(filtros.search && { search: filtros.search }),
      };

      const response = await salesService.getSales(params);
      
      setVendas(response.items || []);
      setPaginacao({
        page: response.page || 1,
        totalPages: Math.ceil((response.total || 0) / paginacao.limit),
        total: response.total || 0,
      });
      
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError('Erro ao carregar as vendas. Tente novamente.');
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Atualizar filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      status: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setPaginacao(prev => ({ ...prev, page: 0 }));
  };

  // Mudar página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 0 && novaPagina < paginacao.totalPages) {
      setPaginacao(prev => ({ ...prev, page: novaPagina }));
    }
  };

  // Formatador de data
  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    const date = new Date(dataString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatador de moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  // Carregar vendas quando os filtros ou paginação mudar
  useEffect(() => {
    carregarVendas(paginacao.page + 1);
  }, [paginacao.page, filtros]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Todas as Vendas</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie e visualize todas as vendas realizadas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md mb-4 md:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                value={filtros.search}
                onChange={handleFiltroChange}
                placeholder="Buscar por número ou cliente..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </button>
            </div>
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={filtros.status}
                    onChange={handleFiltroChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">Todos</option>
                    <option value="concluida">Concluída</option>
                    <option value="paga">Paga</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="reembolsada">Reembolsada</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={filtros.startDate}
                      onChange={handleFiltroChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={filtros.endDate}
                      onChange={handleFiltroChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <div className="text-red-600">
              <X className="mx-auto h-12 w-12" />
              <p className="mt-2 font-medium">{error}</p>
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
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma venda encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros de busca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
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
                      <StatusBadge status={venda.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <PaymentMethod method={venda.payment_method} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                      {formatarMoeda(venda.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/vendas/${venda.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!loading && vendas.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => mudarPagina(paginacao.page - 1)}
                disabled={paginacao.page === 0}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  paginacao.page === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Anterior
              </button>
              <button
                onClick={() => mudarPagina(paginacao.page + 1)}
                disabled={paginacao.page >= paginacao.totalPages - 1}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  paginacao.page >= paginacao.totalPages - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Próxima
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{paginacao.page * paginacao.limit + 1}</span> a{' '}
                  <span className="font-medium">
                    {Math.min((paginacao.page + 1) * paginacao.limit, paginacao.total)}
                  </span>{' '}
                  de <span className="font-medium">{paginacao.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => mudarPagina(paginacao.page - 1)}
                    disabled={paginacao.page === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      paginacao.page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Página {paginacao.page + 1} de {paginacao.totalPages || 1}
                  </span>
                  <button
                    onClick={() => mudarPagina(paginacao.page + 1)}
                    disabled={paginacao.page >= paginacao.totalPages - 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      paginacao.page >= paginacao.totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
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