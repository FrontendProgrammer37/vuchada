import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

// Componente principal da aplicação
const AppContent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Rotas de Admin */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute adminOnly>
              <Layout />
            </ProtectedRoute>
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
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Rotas de Funcionário */}
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute employeeOnly>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route 
            path="pos" 
            element={
              <ProtectedRoute requiredPermission="can_sell">
                <EmployeePOS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="sales" 
            element={
              <ProtectedRoute requiredPermission="can_sell">
                <EmployeeSales />
              </ProtectedRoute>
            } 
          />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
        </Route>

        {/* Rota padrão para redirecionamento */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

// Componente principal App
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
