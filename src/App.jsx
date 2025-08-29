import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import EmployeeLayout from './components/EmployeeLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Funcionarios from './pages/Funcionarios';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import TodasVendas from './pages/TodasVendas';
import PDVPage from './pages/PDVPage';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeePOS from './pages/employee/PointOfSale';
import EmployeeSales from './pages/employee/Sales';
import EmployeeProfile from './pages/employee/Profile';

// Componente para proteger rotas de admin
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente para proteger rotas de funcionário
const ProtectedEmployeeRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !['admin', 'employee'].includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente principal da aplicação
const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            (user?.role === 'admin' ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/employee/dashboard" replace />
            ) : 
            <Login />
        } 
      />
      
      {/* Rotas de Admin */}
      <Route 
        path="/" 
        element={
          <ProtectedAdminRoute>
            <Layout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="vendas" element={<TodasVendas />} />
        <Route path="pdv" element={<PDVPage />} />
      </Route>

      {/* Rotas de Funcionário */}
      <Route 
        path="/employee" 
        element={
          <ProtectedEmployeeRoute>
            <EmployeeLayout />
          </ProtectedEmployeeRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="pos" element={<EmployeePOS />} />
        <Route path="sales" element={<EmployeeSales />} />
        <Route path="profile" element={<EmployeeProfile />} />
      </Route>

      {/* Redirecionamentos */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            (user?.role === 'admin' ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/employee/dashboard" replace />
            ) : 
            <Navigate to="/login" replace />
        } 
      />
    </Routes>
  );
};

// Componente principal App
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <ToastContainer position="bottom-right" autoClose={3000} />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
