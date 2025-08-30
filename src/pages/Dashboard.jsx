import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  ChevronRight,
  Archive,
  TrendingUp as Profit
} from 'lucide-react';
import { getSales } from '../services/salesService';
import apiService from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    vendasMes: 0,
    produtosEstoque: 0,
    receitaHoje: 0,
    receitaMes: 0,
    crescimentoVendas: 0,
    crescimentoReceita: 0,
    valorEmEstoque: 0,
    valorPotencial: 0,
    lucroPotencial: 0,
    lucroHoje: 0
  });

  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesResponse, products] = await Promise.all([
        getSales({ limit: 1000 }), // Fetch more sales to get accurate statistics
        apiService.getProducts()
      ]);

      const sales = salesResponse.items || [];
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

      const parseDate = (iso) => new Date(iso);
      const isSameDay = (d) => d.toISOString().slice(0,10) === todayKey;
      const isSameMonth = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === monthKey;

      const vendasHoje = sales.filter(s => s.created_at && isSameDay(parseDate(s.created_at))).length;
      const vendasMes = sales.filter(s => s.created_at && isSameMonth(parseDate(s.created_at))).length;
      const receitaHoje = sales.filter(s => s.created_at && isSameDay(parseDate(s.created_at)))
                             .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
      const receitaMes = sales.filter(s => s.created_at && isSameMonth(parseDate(s.created_at)))
                            .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

      const produtosEstoque = products.reduce((acc, p) => acc + Number(p.current_stock || 0), 0);
      
      // Novas métricas
      const valorEmEstoque = products.reduce((acc, p) => acc + (Number(p.cost_price || 0) * Number(p.current_stock || 0)), 0);
      const valorPotencial = products.reduce((acc, p) => acc + (Number(p.sale_price || 0) * Number(p.current_stock || 0)), 0);
      const lucroPotencial = valorPotencial - valorEmEstoque;
      
      // Cálculo do lucro de hoje
      const vendasHojeDetalhes = sales.filter(s => s.created_at && isSameDay(parseDate(s.created_at)));
      let lucroHoje = 0;
      
      // Se tivermos acesso aos itens de venda com custo, podemos calcular o lucro real
      // Caso contrário, estimamos com base em uma margem média
      if (vendasHojeDetalhes.some(s => s.items && s.items.length > 0)) {
        lucroHoje = vendasHojeDetalhes.reduce((acc, sale) => {
          if (sale.items && sale.items.length > 0) {
            const custoDaVenda = sale.items.reduce((itemAcc, item) => {
              return itemAcc + (Number(item.cost_price || 0) * Number(item.quantity || 0));
            }, 0);
            return acc + (Number(sale.total_amount || 0) - custoDaVenda);
          }
          return acc;
        }, 0);
      } else {
        // Estimativa baseada em uma margem média de 30%
        lucroHoje = receitaHoje * 0.3;
      }

      const recent = [...sales]
        .sort((a,b) => (new Date(b.created_at||0)) - (new Date(a.created_at||0)))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          cliente: 'Consumidor Final',
          valor: Number(s.total_amount || 0),
          data: s.created_at,
          status: s.status || 'concluída'
        }));

      setStats({
        vendasHoje,
        vendasMes,
        produtosEstoque,
        receitaHoje,
        receitaMes,
        crescimentoVendas: 0,
        crescimentoReceita: 0,
        valorEmEstoque,
        valorPotencial,
        lucroPotencial,
        lucroHoje
      });
      setRecentSales(recent);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
      setError(err.message || 'Erro ao carregar métricas do dashboard');
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral do seu negócio</p>
      </div>

      {/* Cards de métricas - Reorganizados em grid de 2 colunas para mobile */}
      <div className="grid grid-cols-2 gap-4 md:gap-5">
        {/* Vendas hoje */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-500 rounded-md p-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Vendas hoje</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{stats.vendasHoje}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Receita hoje */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-500 rounded-md p-2 mb-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Receita hoje</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.receitaHoje)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Lucro hoje */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-500 rounded-md p-2 mb-2">
                <Profit className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Lucro hoje</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.lucroHoje)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>



        {/* Valor em estoque */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-500 rounded-md p-2 mb-2">
                <Archive className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Valor em estoque</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.valorEmEstoque)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Valor potencial */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-pink-500 rounded-md p-2 mb-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Valor potencial</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.valorPotencial)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Lucro potencial */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-teal-500 rounded-md p-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Lucro potencial</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(stats.lucroPotencial)}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Produtos em estoque */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-500 rounded-md p-2 mb-2">
                <Package className="h-5 w-5 text-white" />
              </div>
              <dl>
                <dt className="text-xs font-medium text-gray-500 truncate">Produtos em estoque</dt>
                <dd>
                  <div className="text-lg font-bold text-gray-900">{stats.produtosEstoque}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Vendas recentes */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Vendas recentes</h2>
          <a href="/vendas" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Ver todas
          </a>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="block lg:hidden">
            <div className="divide-y divide-gray-200">
              {recentSales.map((sale) => (
                <div key={sale.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{formatDate(sale.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.valor)}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mt-1">
                        {sale.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(sale.valor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(sale.data)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{sale.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;