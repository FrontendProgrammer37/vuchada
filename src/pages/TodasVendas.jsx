import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, FileText, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import saleService from '../services/saleService';

// Função para formatar valores em Metical (MZN)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Função para formatar data
const formatDate = (dateString) => {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
};

// Componente de status da venda
const StatusBadge = ({ status }) => {
  const statusConfig = {
    concluida: {
      icon: <CheckCircle size={16} className="mr-1" />,
      color: 'bg-green-100 text-green-800',
      label: 'Concluída'
    },
    cancelada: {
      icon: <XCircle size={16} className="mr-1" />,
      color: 'bg-red-100 text-red-800',
      label: 'Cancelada'
    },
    pendente: {
      icon: <Clock size={16} className="mr-1" />,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pendente'
    }
  };

  const config = statusConfig[status] || statusConfig.pendente;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const TodasVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    start_date: '',
    end_date: '',
    payment_method: '',
    status: ''
  });
  const [paginacao, setPaginacao] = useState({
    pagina: 1,
    itensPorPagina: 10,
    total: 0
  });

  // Carregar vendas quando os filtros ou a página mudar
  useEffect(() => {
    carregarVendas();
  }, [paginacao.pagina, filtros]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      
      // Construir parâmetros da API
      const params = {
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        limit: paginacao.itensPorPagina,
        ...filtros
      };

      // Remover filtros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const { data: vendas, total } = await saleService.listSales(params);
      
      // Atualizar estado com as vendas
      setVendas(vendas);
      
      // Atualizar total de itens para paginação
      setPaginacao(prev => ({
        ...prev,
        total
      }));
      
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError('Erro ao carregar as vendas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Manipuladores de eventos
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitFiltros = (e) => {
    e.preventDefault();
    // Resetar para a primeira página ao aplicar novos filtros
    setPaginacao(prev => ({
      ...prev,
      pagina: 1
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      start_date: '',
      end_date: '',
      payment_method: '',
      status: ''
    });
  };

  // Navegação de páginas
  const irParaPagina = (pagina) => {
    setPaginacao(prev => ({
      ...prev,
      pagina
    }));
  };

  // Métodos de pagamento disponíveis
  const metodosPagamento = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'MPESA', label: 'M-Pesa' },
    { value: 'CARTAO_POS', label: 'Cartão POS' },
    { value: 'TRANSFERENCIA', label: 'Transferência' },
    { value: 'MILLENNIUM', label: 'Millennium' },
    { value: 'BCI', label: 'BCI' },
    { value: 'STANDARD_BANK', label: 'Standard Bank' },
    { value: 'ABSA_BANK', label: 'ABSA Bank' },
    { value: 'LETSHEGO', label: 'Letshego' },
    { value: 'MYBUCKS', label: 'MyBucks' }
  ];

  // Status disponíveis
  const statusVenda = [
    { value: 'concluida', label: 'Concluída' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Todas as Vendas</h1>
        <p className="text-gray-600">Visualize e gerencie todas as vendas realizadas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Filtros</h2>
          <button
            onClick={limparFiltros}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Limpar filtros
          </button>
        </div>
        
        <form onSubmit={handleSubmitFiltros} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              name="start_date"
              value={filtros.start_date}
              onChange={handleFiltroChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              name="end_date"
              value={filtros.end_date}
              onChange={handleFiltroChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
            <select
              name="payment_method"
              value={filtros.payment_method}
              onChange={handleFiltroChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {metodosPagamento.map(metodo => (
                <option key={metodo.value} value={metodo.value}>
                  {metodo.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filtros.status}
              onChange={handleFiltroChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {statusVenda.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter size={16} className="mr-2" />
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Vendas */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={carregarVendas}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Tentar novamente
            </button>
          </div>
        ) : vendas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>Nenhuma venda encontrada com os filtros atuais.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nº Venda
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
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {venda.sale_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(venda.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={venda.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {metodosPagamento.find(m => m.value === venda.payment_method)?.label || venda.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        {formatCurrency(venda.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={() => {
                            // Implementar visualização de detalhes
                            console.log('Visualizar venda:', venda.id);
                          }}
                        >
                          <FileText size={18} />
                        </button>
                        {venda.status === 'pendente' && (
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={async () => {
                              if (window.confirm('Tem certeza que deseja cancelar esta venda?')) {
                                try {
                                  await saleService.cancelSale(venda.id, 'Cancelado pelo usuário');
                                  await carregarVendas(); // Recarregar a lista
                                } catch (error) {
                                  console.error('Erro ao cancelar venda:', error);
                                  alert('Erro ao cancelar venda');
                                }
                              }
                            }}
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => irParaPagina(paginacao.pagina - 1)}
                  disabled={paginacao.pagina === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginacao.pagina === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => irParaPagina(paginacao.pagina + 1)}
                  disabled={vendas.length < paginacao.itensPorPagina}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    vendas.length < paginacao.itensPorPagina ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
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
                      onClick={() => irParaPagina(paginacao.pagina - 1)}
                      disabled={paginacao.pagina === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        paginacao.pagina === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft size={20} />
                    </button>
                    
                    {/* Números de página */}
                    {Array.from({ length: Math.ceil(paginacao.total / paginacao.itensPorPagina) }, (_, i) => i + 1)
                      .filter(page => {
                        // Mostrar apenas algumas páginas ao redor da atual
                        return (
                          page === 1 ||
                          page === paginacao.pagina ||
                          page === paginacao.pagina - 1 ||
                          page === paginacao.pagina + 1 ||
                          page === Math.ceil(paginacao.total / paginacao.itensPorPagina)
                        );
                      })
                      .map((page, i, array) => {
                        // Adicionar "..." entre páginas não mostradas
                        if (i > 0 && array[i] > array[i - 1] + 1) {
                          return (
                            <span key={`ellipsis-${i}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => irParaPagina(page)}
                            className={`relative inline-flex items-center px-4 py-2 border ${
                              page === paginacao.pagina
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            } text-sm font-medium`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      onClick={() => irParaPagina(paginacao.pagina + 1)}
                      disabled={vendas.length < paginacao.itensPorPagina}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        vendas.length < paginacao.itensPorPagina ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Próxima</span>
                      <ChevronRight size={20} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botão de exportar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            // Implementar exportação de relatório
            console.log('Exportar relatório');
          }}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Download size={16} className="mr-2" />
          Exportar Relatório
        </button>
      </div>
    </div>
  );
};

export default TodasVendas;