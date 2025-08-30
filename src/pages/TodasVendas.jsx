import {useState, useEffect } from 'react';
import { Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSales } from '../api/sales';

const TodasVendas = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSales(page, limit, filters);
      setSales(data.items || data || []);
      setTotalPages(Math.ceil((data.total || 1) / limit));
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError('Não foi possível carregar as vendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: ''
    });
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Todas as Vendas</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Filter size={18} />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="concluida">Concluída</option>
                <option value="pendente">Pendente</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={resetFilters}
                  className="px-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadSales}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">Nenhuma venda encontrada</p>
          <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.sale_number || `#${sale.id}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sale.status === 'concluida' 
                            ? 'bg-green-100 text-green-800' 
                            : sale.status === 'cancelada' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sale.status === 'concluida' ? 'Concluída' : 
                           sale.status === 'cancelada' ? 'Cancelada' : 
                           sale.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a 
                          href={`/vendas/${sale.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver detalhes
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className={`px-4 py-2 rounded-md ${
                  page === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft size={16} className="inline mr-1" />
                Anterior
              </button>
              
              <span className="text-sm text-gray-700">
                Página {page + 1} de {totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className={`px-4 py-2 rounded-md ${
                  page >= totalPages - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Próxima
                <ChevronRight size={16} className="inline ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TodasVendas;