import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import salesService from '../services/salesService';
import { toast } from '../utils/toast';

const TodasVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    pagamento: ''
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Carregar vendas
  const carregarVendas = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      const response = await salesService.getSales(paginaAtual, itensPorPagina);
      
      // Transformar os dados para o formato esperado pelo componente
      const vendasFormatadas = response.items.map(venda => ({
        id: venda.id,
        data: venda.created_at,
        cliente: venda.customer?.name || 'Cliente não informado',
        valor: venda.total_amount,
        status: venda.status,
        pagamento: venda.payment_method,
        itens: venda.items?.length || 0
      }));
      
      setVendas(vendasFormatadas);
      setTotalPaginas(response.total_pages || 1);
      
    } catch (erro) {
      console.error('Erro ao carregar vendas:', erro);
      setErro('Erro ao carregar as vendas. Tente novamente mais tarde.');
      toast.error('Erro ao carregar as vendas');
    } finally {
      setCarregando(false);
    }
  };

  // Efeito para carregar as vendas quando os filtros ou a página mudar
  useEffect(() => {
    carregarVendas();
  }, [paginaAtual, filtros]);

  // Manipuladores de eventos
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    setPaginaAtual(1); // Resetar para a primeira página ao mudar filtros
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      status: '',
      pagamento: ''
    });
    setPaginaAtual(1);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return format(data, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor || 0);
  };

  // Renderização condicional
  if (carregando && vendas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Todas as Vendas</h1>
      
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filtros.status}
              onChange={handleFiltroChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="completed">Concluídas</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
            <select
              name="pagamento"
              value={filtros.pagamento}
              onChange={handleFiltroChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="MPESA">M-Pesa</option>
              <option value="CARTAO_POS">Cartão</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </div>
          <button
            onClick={limparFiltros}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
          >
            <X size={16} /> Limpar
          </button>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendas.map((venda) => (
                <tr key={venda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatarData(venda.data)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venda.itens}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {formatarMoeda(venda.valor)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {venda.pagamento}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      venda.status === 'completed' ? 'bg-green-100 text-green-800' :
                      venda.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {venda.status === 'completed' ? 'Concluída' :
                       venda.status === 'pending' ? 'Pendente' :
                       'Cancelada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Ver</button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Download size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {vendas.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma venda encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual(p => p + 1)}
              disabled={vendas.length < itensPorPagina}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(paginaAtual - 1) * itensPorPagina + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(paginaAtual * itensPorPagina, vendas.length + ((paginaAtual - 1) * itensPorPagina))}
                </span>{' '}
                de <span className="font-medium">{vendas.length + ((paginaAtual - 1) * itensPorPagina)}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Página {paginaAtual}
                </span>
                <button
                  onClick={() => setPaginaAtual(p => p + 1)}
                  disabled={vendas.length < itensPorPagina}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próxima</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodasVendas;