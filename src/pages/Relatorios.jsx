import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  X
} from 'lucide-react';
import apiService from '../services/api';

const Relatorios = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [stats, setStats] = useState({
    vendasTotal: 0,
    receitaTotal: 0,
    produtosVendidos: 0,
    ticketMedio: 0,
    crescimentoVendas: 0,
    crescimentoReceita: 0
  });

  const [topProdutos, setTopProdutos] = useState([]);
  const [vendasPorDia, setVendasPorDia] = useState([]);
  const [categoriasVendas, setCategoriasVendas] = useState([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, dataInicio, dataFim]);

  const parseDate = (d) => new Date(d);
  const isWithinRange = (date) => {
    const d = typeof date === 'string' ? parseDate(date) : date;
    if (periodo === 'personalizado') {
      if (dataInicio && d < new Date(dataInicio)) return false;
      if (dataFim && d > new Date(dataFim + 'T23:59:59')) return false;
      return true;
    }
    const now = new Date();
    if (periodo === 'hoje') {
      const key = now.toISOString().slice(0,10);
      return d.toISOString().slice(0,10) === key;
    }
    if (periodo === 'semana') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0,0,0,0);
      const end = new Date(now);
      end.setHours(23,59,59,999);
      return d >= start && d <= end;
    }
    if (periodo === 'mes') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (periodo === 'trimestre') {
      const q = Math.floor(now.getMonth() / 3);
      return d.getFullYear() === now.getFullYear() && Math.floor(d.getMonth()/3) === q;
    }
    if (periodo === 'ano') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sales, products, categories] = await Promise.all([
        apiService.getSales(),
        apiService.getProducts(),
        apiService.getCategories()
      ]);

      const salesFiltered = sales.filter(s => s.created_at && isWithinRange(new Date(s.created_at)));
      const vendasTotal = salesFiltered.length;
      const receitaTotal = salesFiltered.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
      const produtosVendidos = salesFiltered.reduce((acc, _s) => acc + 1, 0); // sem itens, usamos o número de vendas como aproximação
      const ticketMedio = vendasTotal ? receitaTotal / vendasTotal : 0;

      // Vendas por dia (contagem e receita)
      const mapPorDia = new Map();
      salesFiltered.forEach(s => {
        const key = String(s.created_at).slice(0,10);
        const entry = mapPorDia.get(key) || { vendas: 0, receita: 0 };
        entry.vendas += 1;
        entry.receita += Number(s.total_amount || 0);
        mapPorDia.set(key, entry);
      });
      const vendasPorDiaArr = Array.from(mapPorDia.entries())
        .sort((a,b) => new Date(a[0]) - new Date(b[0]))
        .map(([dia, v]) => ({ dia: new Date(dia).toLocaleDateString('pt-MZ'), vendas: v.vendas, receita: v.receita }));

      // Categorias de vendas (sem itens, aproximamos por contagem de vendas por categoria do produto mais vendido? Não temos itens.
      // Fallback: distribuição por categoria do catálogo (0) e mostrarmos apenas totais zerados para não confundir)
      const categoriasMap = new Map(categories.map(c => [c.id, c.name]));
      const categoriasVendasArr = products.slice(0,4).map(p => ({
        categoria: categoriasMap.get(p.category_id) || 'Sem categoria',
        vendas: 0,
        receita: 0,
        percentual: 0
      }));

      // Top produtos (sem itens, não dá para inferir). Fallback: produtos com maior estoque (indicativo)
      const topProdutosArr = [...products]
        .sort((a,b) => Number(b.current_stock||0) - Number(a.current_stock||0))
        .slice(0,5)
        .map(p => ({ nome: p.name, vendas: 0, receita: 0, categoria: (categoriasMap.get(p.category_id) || '-') }));

      setStats({
        vendasTotal,
        receitaTotal,
        produtosVendidos,
        ticketMedio,
        crescimentoVendas: 0,
        crescimentoReceita: 0
      });
      setVendasPorDia(vendasPorDiaArr);
      setCategoriasVendas(categoriasVendasArr);
      setTopProdutos(topProdutosArr);
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `MT ${Number(value||0).toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getPeriodoLabel = () => {
    switch (periodo) {
      case 'hoje': return 'Hoje';
      case 'semana': return 'Esta Semana';
      case 'mes': return 'Este Mês';
      case 'trimestre': return 'Este Trimestre';
      case 'ano': return 'Este Ano';
      case 'personalizado': return 'Período Personalizado';
      default: return 'Este Mês';
    }
  };

  const handleExport = (tipo) => {
    alert(`Exportando relatório de ${tipo}...`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 lg:px-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm lg:text-base text-gray-600">Análise detalhada do seu negócio</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </button>
          <button
            onClick={() => handleExport('geral')}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className={`px-4 lg:px-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white p-4 rounded-lg shadow-sm lg:shadow">
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h3 className="text-sm font-medium text-gray-900">Filtros de Período</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
                <option value="trimestre">Este Trimestre</option>
                <option value="ano">Este Ano</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={periodo !== 'personalizado'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={periodo !== 'personalizado'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setPeriodo('mes'); setDataInicio(''); setDataFim(''); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Período */}
      <div className="px-4 lg:px-0">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4 lg:p-6 text-white">
          <div className="flex items-center mb-4">
            <Calendar className="h-6 w-6 mr-3" />
            <h2 className="text-lg lg:text-xl font-semibold">{getPeriodoLabel()}</h2>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-blue-100">Vendas</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.vendasTotal}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-blue-100">Receita</p>
              <p className="text-lg lg:text-xl font-bold">{formatCurrency(stats.receitaTotal)}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-blue-100">Ticket Médio</p>
              <p className="text-lg lg:text-xl font-bold">{formatCurrency(stats.ticketMedio)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Vendas por Dia */}
          <div className="bg-white rounded-lg shadow-sm lg:shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-medium text-gray-900">Vendas por Dia</h3>
              <button onClick={() => handleExport('vendas-dia')} className="text-blue-600 hover:text-blue-800 text-sm">
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {vendasPorDia.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">{item.dia}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{item.vendas} vendas</p>
                    <p className="text-xs text-gray-500">{formatCurrency(item.receita)}</p>
                  </div>
                </div>
              ))}
              {vendasPorDia.length === 0 && (
                <div className="text-sm text-gray-500">Sem dados no período selecionado.</div>
              )}
            </div>
          </div>

          {/* Top Produtos (fallback) */}
          <div className="bg-white rounded-lg shadow-sm lg:shadow p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base lg:text-lg font-medium text-gray-900">Top Produtos</h3>
              <button onClick={() => handleExport('top-produtos')} className="text-blue-600 hover:text-blue-800 text-sm">
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {topProdutos.map((produto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-xs text-gray-500">{produto.categoria}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{produto.vendas} vendas</p>
                    <p className="text-xs text-gray-500">{formatCurrency(produto.receita)}</p>
                  </div>
                </div>
              ))}
              {topProdutos.length === 0 && (
                <div className="text-sm text-gray-500">Sem dados de produtos.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendas por Categoria (fallback) */}
      <div className="px-4 lg:px-0">
        <div className="bg-white rounded-lg shadow-sm lg:shadow p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base lg:text-lg font-medium text-gray-900">Vendas por Categoria</h3>
            <button onClick={() => handleExport('categorias')} className="text-blue-600 hover:text-blue-800 text-sm">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {categoriasVendas.map((categoria, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <PieChart className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{categoria.categoria}</p>
                    <p className="text-xs text-gray-500">{categoria.vendas} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(categoria.receita)}</p>
                  <p className="text-xs text-gray-500">{categoria.percentual}% do total</p>
                </div>
              </div>
            ))}
            {categoriasVendas.length === 0 && (
              <div className="text-sm text-gray-500">Sem dados de categorias.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Relatorios;