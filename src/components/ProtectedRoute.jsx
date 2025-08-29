import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
    children, 
    requiredPermission = null, 
    adminOnly = false, 
    employeeOnly = false,
    redirectTo = '/login' 
}) => {
    const { user, loading, isAdmin, isEmployee, hasPermission } = useAuth();

    if (loading) {
        return <div>Carregando...</div>; // Ou um componente de loading
    }

    // Se não estiver autenticado, redireciona para a página de login
    if (!user) {
        return <Navigate to={redirectTo} replace />;
    }

    // Verifica se a rota é apenas para administradores
    if (adminOnly && !isAdmin()) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Verifica se a rota é apenas para funcionários
    if (employeeOnly && !isEmployee()) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Verifica se o usuário tem a permissão necessária
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;
