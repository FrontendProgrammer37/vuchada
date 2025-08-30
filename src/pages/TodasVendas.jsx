import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import apiService from '../services/api';

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
  }, [paginacao.pagina]);

  const carregarVendas = async () => {
    try {
      setLoading(true);
      // Aqui podemos adicionar parâmetros de filtro e paginação quando a API suportar
      const vendas = await apiService.getSales();
      
      // Aplicar filtros localmente enquanto não temos filtros na API
      let vendasFiltradas = [...vendas];
      
      if (filtro.dataInicio) {
        vendasFiltradas = vendasFiltradas.filter(v => 
          new Date(v.created_at) >= new Date(filtro.dataInicio)
        );
      }
      
      if (filtro.dataFim) {
        vendasFiltradas = vendasFiltradas.filter(v => 
          new Date(v.created_at) <= new Date(filtro.dataFim)
        );
      }
      
      // Filtro de cliente removido
      
      if (filtro.status) {
        vendasFiltradas = vendasFiltradas.filter(v => 
          v.status && v.status.toLowerCase().includes(filtro.status.toLowerCase())
        );
      }
      
      if (filtro.valorMinimo) {
        vendasFiltradas = vendasFiltradas.filter(v => 
          Number(v.total_amount || 0) >= Number(filtro.valorMinimo)
        );
      }
      
      if (filtro.valorMaximo) {
        vendasFiltradas = vendasFiltradas.filter(v => 
          Number(v.total_amount || 0) <= Number(filtro.valorMaximo)
        );
      }
      
      // Ordenar por data mais recente
      vendasFiltradas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      
      // Calcular total para paginação
      const total = vendasFiltradas.length;
      
      // Aplicar paginação
      const inicio = (paginacao.pagina - 1) * paginacao.itensPorPagina;
      const fim = inicio + paginacao.itensPorPagina;
      const vendasPaginadas = vendasFiltradas.slice(inicio, fim);
      
      setVendas(vendasPaginadas);
      setPaginacao(prev => ({ ...prev, total }));
      setError(null);
    } catch (err) {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Todas as Vendas</h1>
        <p className="mt-1 text-sm text-gray-500">Histórico completo de vendas</p>
      </div>

      {/* Filtros - Adaptado para mobile */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            <button 
              type="button" 
              onClick={() => document.getElementById('filtrosForm').classList.toggle('hidden')}
              className="md:hidden inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </button>
          </div>
          <form id="filtrosForm" onSubmit={aplicarFiltro} className="hidden md:block">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {/* Campo de cliente removido */}
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
                  <option value="pendente">Pendente</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div>
                <label htmlFor="valorMinimo" className="block text-sm font-medium text-gray-700">Valor Mínimo</label>
                <input
                  type="number"
                  id="valorMinimo"
                  name="valorMinimo"
                  value={filtro.valorMinimo}
                  onChange={handleFiltroChange}
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="valorMaximo" className="block text-sm font-medium text-gray-700">Valor Máximo</label>
                <input
                  type="number"
                  id="valorMaximo"
                  name="valorMaximo"
                  value={filtro.valorMaximo}
                  onChange={handleFiltroChange}
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={limparFiltro}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Limpar
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Mostrando {Math.min(paginacao.total, 1 + (paginacao.pagina - 1) * paginacao.itensPorPagina)} - {Math.min(paginacao.total, paginacao.pagina * paginacao.itensPorPagina)} de {paginacao.total} vendas
        </div>
        <button
          onClick={exportarCSV}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Tabela de vendas */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
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
      ) : (
        <>
          {/* Versão mobile - Cards melhorados */}
          <div className="block lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vendas.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
                  Nenhuma venda encontrada
                </div>
              ) : (
                vendas.map((venda) => (
                  <div key={venda.id} className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className={`h-2 w-full ${venda.status === 'cancelada' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex justify-between">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Venda #{venda.sale_number || venda.id}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${venda.status === 'cancelada' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {venda.status || 'concluída'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">ID</p>
                          <p className="font-medium">{venda.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor</p>
                          <p className={`font-medium font-bold ${verificarValorReal(venda.total_amount) ? 'text-gray-900' : 'text-red-500'}`}>
                            {formatarMoeda(venda.total_amount)}
                          </p>
                          {!verificarValorReal(venda.total_amount) && (
                            <p className="text-xs text-red-500">Valor inválido</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">Data</p>
                          <p className="font-medium">{formatarData(venda.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Itens</p>
                          <p className="font-medium">{venda.items?.length || 0}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <a href={`/vendas/${venda.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver detalhes
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Versão desktop */}
          <div className="hidden lg:block">
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    {/* Coluna de cliente removida */}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Itens
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        Nenhuma venda encontrada
                      </td>
                    </tr>
                  ) : (
                    vendas.map((venda) => (
                      <tr key={venda.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {venda.id}
                        </td>
                        {/* Célula de cliente removida */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className={`${verificarValorReal(venda.total_amount) ? 'text-gray-900' : 'text-red-500'}`}>
                      {formatarMoeda(venda.total_amount)}
                    </div>
                    {!verificarValorReal(venda.total_amount) && (
                      <div className="text-xs text-red-500">Valor inválido</div>
                    )}
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatarData(venda.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${venda.status === 'cancelada' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {venda.status || 'concluída'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {venda.items?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <a href={`/vendas/${venda.id}`} className="text-indigo-600 hover:text-indigo-900">
                            Detalhes
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Paginação */}
      {!loading && vendas.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md shadow">
          <div className="flex flex-col space-y-3 sm:hidden w-full">
            <div className="flex justify-center items-center">
              <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-md">
                Página {paginacao.pagina} de {Math.ceil(paginacao.total / paginacao.itensPorPagina)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => mudarPagina(paginacao.pagina - 1)}
                disabled={paginacao.pagina === 1}
                className={`flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ${paginacao.pagina === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <button
                onClick={() => mudarPagina(paginacao.pagina + 1)}
                disabled={paginacao.pagina >= Math.ceil(paginacao.total / paginacao.itensPorPagina)}
                className={`flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ${paginacao.pagina >= Math.ceil(paginacao.total / paginacao.itensPorPagina) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{Math.min(paginacao.total, 1 + (paginacao.pagina - 1) * paginacao.itensPorPagina)}</span> a <span className="font-medium">{Math.min(paginacao.total, paginacao.pagina * paginacao.itensPorPagina)}</span> de <span className="font-medium">{paginacao.total}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => mudarPagina(paginacao.pagina - 1)}
                  disabled={paginacao.pagina === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${paginacao.pagina === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                >
                  <span className="sr-only">Anterior</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Páginas */}
                {Array.from({ length: Math.min(5, Math.ceil(paginacao.total / paginacao.itensPorPagina)) }, (_, i) => {
                  // Lógica para mostrar páginas ao redor da página atual
                  let pageNum;
                  const totalPages = Math.ceil(paginacao.total / paginacao.itensPorPagina);
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (paginacao.pagina <= 3) {
                    pageNum = i + 1;
                  } else if (paginacao.pagina >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = paginacao.pagina - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => mudarPagina(pageNum)}
                      aria-current={paginacao.pagina === pageNum ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${paginacao.pagina === pageNum ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => mudarPagina(paginacao.pagina + 1)}
                  disabled={paginacao.pagina >= Math.ceil(paginacao.total / paginacao.itensPorPagina)}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${paginacao.pagina >= Math.ceil(paginacao.total / paginacao.itensPorPagina) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}`}
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
  );
};

export default TodasVendas;