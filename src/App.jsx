import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Funcionarios from './pages/Funcionarios';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import TodasVendas from './pages/TodasVendas';
import PDVPage from './pages/PDVPage';

// Componente para proteger rotas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Componente principal da aplicação
const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      <Route 
        path="/" 
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <ProtectedRoute>
            <Layout>
              <Produtos />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/funcionarios"
        element={
          <ProtectedRoute>
            <Layout>
              <Funcionarios />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute>
            <Layout>
              <Relatorios />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendas"
        element={
          <ProtectedRoute>
            <Layout>
              <TodasVendas />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pdv"
        element={
          <ProtectedRoute>
            <Layout>
              <PDVPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <Layout>
              <Configuracoes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate to="/dashboard" replace />
        }
      />
    </Routes>
  );
};

// Componente principal App
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <AppContent />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
