import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

    // Carrega o usuário do localStorage na inicialização
    const loadUserFromStorage = useCallback(() => {
        try {
            const userData = apiService.getCurrentUserFromStorage();
            if (userData) {
                setUser(userData);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário do localStorage:', error);
        }
    }, []);

    // Verifica a autenticação no servidor
    const checkAuth = useCallback(async () => {
        try {
            setLoading(true);
            const userData = await apiService.getCurrentUser();
            setUser(userData);
            setError(null);
            return userData;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            if (error.status === 401) {
                // Token inválido ou expirado
                apiService.logout();
                setUser(null);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Verifica autenticação ao carregar o componente
    useEffect(() => {
        loadUserFromStorage();
        
        const token = localStorage.getItem('token');
        if (token) {
            checkAuth().catch(() => {
                // Se houver erro, o estado já foi limpo no checkAuth
            });
        } else {
            setLoading(false);
        }
    }, [loadUserFromStorage, checkAuth]);

    // Login
    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            
            // Faz o login e obtém o token
            const loginResponse = await apiService.login(username, password);
            
            // Tenta obter os dados do usuário
            let userData = loginResponse.user;
            
            if (!userData) {
                userData = await apiService.getCurrentUser();
            }
            
            if (!userData) {
                throw new Error('Não foi possível carregar os dados do usuário');
            }
            
            setUser(userData);
            return userData;
            
        } catch (error) {
            console.error('Erro no login:', error);
            
            // Mensagens de erro mais amigáveis
            let errorMessage = 'Erro ao fazer login';
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
            } else if (error.status === 401 || error.message.includes('401') || error.message.includes('credenciais')) {
                errorMessage = 'Usuário ou senha inválidos';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Logout
    const logout = async () => {
        try {
            // Clear user state first to prevent any UI flicker
            setUser(null);
            setError(null);
            
            // Call the API logout - this will clear local storage
            await apiService.logout();
            
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Even if there's an error, we still want to clear the local state
            setUser(null);
            setError(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    };

    // Verifica se o usuário tem uma permissão específica
    const hasPermission = (permission) => {
        if (!user) return false;
        return apiService.hasPermission(permission);
    };

    // Verifica se o usuário é um funcionário
    const isEmployee = () => {
        return user?.role === 'employee';
    };

    // Verifica se o usuário é um administrador
    const isAdmin = () => {
        return user?.role === 'admin';
    };

    // Verifica se o usuário está autenticado
    const isAuthenticated = () => {
        return !!user;
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        checkAuth,
        hasPermission,
        isEmployee,
        isAdmin,
        isAuthenticated,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;