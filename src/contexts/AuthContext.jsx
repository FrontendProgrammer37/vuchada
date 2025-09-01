import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import cartService from '../services/cartService';

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

    // Check authentication status on app load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Try to get user data from localStorage first
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                    
                    // Then refresh from the server
                    const userData = await apiService.getCurrentUser();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                // Clear invalid auth data
                apiService.removeToken();
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Login
    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await apiService.login(username, password);
            
            // Use the user data from the login response
            if (response.user) {
                setUser(response.user);
                return { success: true };
            }
            
            // Fallback: Try to get user data from /me endpoint
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
    const logout = async () => {
        try {
            // Clear the cart before logging out
            await cartService.clearCart();
        } catch (error) {
            console.error('Error clearing cart during logout:', error);
            // Continue with logout even if clearing cart fails
        } finally {
            // Clear all auth-related data
            apiService.logout();
            localStorage.removeItem('user');
            setUser(null);
            setError(null);
        }
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