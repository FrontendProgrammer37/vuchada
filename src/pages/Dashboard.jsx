import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  ChevronRight
} from 'lucide-react';
import apiService from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    vendasMes: 0,
    clientesAtivos: 0,
    produtosEstoque: 0,
    receitaHoje: 0,
    receitaMes: 0,
    crescimentoVendas: 0,
    crescimentoReceita: 0
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
      const [sales, products, customers] = await Promise.all([
        apiService.getSales(),
        apiService.getProducts(),
        apiService.getCustomers()
      ]);

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
      const clientesAtivos = customers.length;

      const recent = [...sales]
        .sort((a,b) => (new Date(b.created_at||0)) - (new Date(a.created_at||0)))
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          cliente: s.customer_id ? `Cliente #${s.customer_id}` : 'Consumidor Final',
          valor: Number(s.total_amount || 0),
          data: s.created_at,
          status: s.status || 'concluída'
        }));

      setStats({
        vendasHoje,
        vendasMes,
        clientesAtivos,
        produtosEstoque,
        receitaHoje,
        receitaMes,
        crescimentoVendas: 0,
        crescimentoReceita: 0
      });
      setRecentSales(recent);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar métricas');
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-6">
      <div className="px-4 lg:px-0">
        <h1 className="text-lg lg:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs lg:text-base text-gray-600 mt-1">Visão geral do seu negócio</p>
      </div>

      {error && (
        <div className="px-4 lg:px-0">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        </div>
      )}

      <div className="px-4 lg:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white rounded-xl shadow-sm lg:shadow p-3 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <ShoppingCart className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div className="ml-2 lg:ml-4 flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Vendas Hoje</p>
                <p className="text-base lg:text-2xl font-bold text-gray-900">{stats.vendasHoje}</p>
              </div>
            </div>
            <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-1 flex-shrink-0" />
              <span className="text-green-600 font-medium">+{stats.crescimentoVendas}%</span>
              <span className="text-gray-500 ml-1 hidden sm:inline">vs ontem</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm lg:shadow p-3 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <DollarSign className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div className="ml-2 lg:ml-4 flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Receita Hoje</p>
                <p className="text-xs lg:text-lg font-bold text-gray-900 break-words leading-tight">
                  {formatCurrency(stats.receitaHoje)}
                </p>
              </div>
            </div>
            <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-1 flex-shrink-0" />
              <span className="text-green-600 font-medium">+{stats.crescimentoReceita}%</span>
              <span className="text-gray-500 ml-1 hidden sm:inline">vs ontem</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm lg:shadow p-3 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                <Users className="h-4 w-4 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div className="ml-2 lg:ml-4 flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Clientes</p>
                <p className="text-base lg:text-2xl font-bold text-gray-900">{stats.clientesAtivos}</p>
              </div>
            </div>
            <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
              <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-1 flex-shrink-0" />
              <span className="text-green-600 font-medium">+5.2%</span>
              <span className="text-gray-500 ml-1 hidden sm:inline">este mês</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm lg:shadow p-3 lg:p-6">
            <div className="flex items-center">
              <div className="p-2 lg:p-3 bg-orange-100 rounded-lg flex-shrink-0">
                <Package className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
              </div>
              <div className="ml-2 lg:ml-4 flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Estoque</p>
                <p className="text-base lg:text-2xl font-bold text-gray-900">{stats.produtosEstoque}</p>
              </div>
            </div>
            <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
              <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4 text-red-500 mr-1 flex-shrink-0" />
              <span className="text-red-600 font-medium">-2.1%</span>
              <span className="text-gray-500 ml-1 hidden sm:inline">vs mês passado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-0">
        <div className="bg-white rounded-xl shadow-sm lg:shadow p-4 lg:p-6">
          <h3 className="text-sm lg:text-lg font-medium text-gray-900 mb-3 lg:mb-4">Vendas Mensais</h3>
          <div className="space-y-2 lg:space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs lg:text-sm text-gray-600">Mês atual</span>
              <span className="text-xs lg:text-sm font-medium text-gray-900">{stats.vendasMes} vendas</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs lg:text-sm text-gray-600">Receita Total</span>
              <span className="text-xs lg:text-sm font-medium text-gray-900 break-words">{formatCurrency(stats.receitaMes)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-0">
        <div className="bg-white rounded-xl shadow-sm lg:shadow">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm lg:text-lg font-medium text-gray-900">Vendas Recentes</h3>
              <button className="lg:hidden inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                Ver todas
                <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>
          <div className="lg:hidden">
            <div className="divide-y divide-gray-100">
              {recentSales.slice(0, 3).map((sale) => (
                <div key={sale.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{sale.cliente}</h4>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(sale.data)}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-semibold text-gray-900 break-words">{formatCurrency(sale.valor)}</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.cliente}</td>
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