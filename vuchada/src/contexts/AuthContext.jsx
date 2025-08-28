import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verificar se há token salvo ao carregar a aplicação
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    // Verificar autenticação com o token salvo
    const checkAuth = async () => {
        try {
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            setError(null);
        } catch (err) {
            console.error('Erro ao verificar autenticação:', err);
            apiService.removeToken();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Login
    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiService.login(username, password);
            const userData = await apiService.getCurrentUser();
            
            setUser(userData);
            return { success: true };
        } catch (err) {
            setError(err.message || 'Erro no login');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = () => {
        apiService.logout();
        setUser(null);
        setError(null);
    };

    // Limpar erro
    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        clearError,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.is_superuser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 