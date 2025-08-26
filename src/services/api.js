// Serviço de API para conectar com o backend
import config from '../config/env';
const API_BASE_URL = config.API_URL;

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Configurar headers com token de autenticação
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Atualizar token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Remover token (logout)
    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Função genérica para fazer requisições
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expirado ou inválido
                this.removeToken();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            // Para respostas 204 No Content, retornar objeto vazio em vez de tentar parsear JSON
            if (response.status === 204) {
                return {};
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ===== AUTENTICAÇÃO =====
    
    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Falha no login');
        }

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    }

    async logout() {
        this.removeToken();
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // ===== CATEGORIAS =====
    
    async getCategories() {
        return this.request('/categories/');
    }

    async getCategory(id) {
        return this.request(`/categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.request('/categories/', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    async updateCategory(id, categoryData) {
        return this.request(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    async deleteCategory(id) {
        return this.request(`/categories/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== PRODUTOS =====
    
    async getProducts() {
        return this.request('/products/');
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.request('/products/', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    }

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData),
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }

    async deleteAllProducts() {
        return this.request('/products/delete-all', {
            method: 'DELETE',
        });
    }

    // ===== FUNCIONÁRIOS =====
    
    async getEmployees() {
        return this.request('/employees/');
    }

    async getEmployee(id) {
        return this.request(`/employees/${id}`);
    }

    async createEmployee(employeeData) {
        return this.request('/employees/', {
            method: 'POST',
            body: JSON.stringify(employeeData),
        });
    }

    async updateEmployee(id, employeeData) {
        return this.request(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData),
        });
    }

    async deleteEmployee(id) {
        return this.request(`/employees/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== CLIENTES =====
    
    async getCustomers() {
        return this.request('/customers/');
    }

    async getCustomer(id) {
        return this.request(`/customers/${id}`);
    }

    async createCustomer(customerData) {
        return this.request('/customers/', {
            method: 'POST',
            body: JSON.stringify(customerData),
        });
    }

    async updateCustomer(id, customerData) {
        return this.request(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData),
        });
    }

    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== VENDAS =====
    
    async getSales() {
        return this.request('/sales/');
    }

    async getSale(id) {
        return this.request(`/sales/${id}`);
    }

    async createSale(saleData) {
        return this.request('/sales/', {
            method: 'POST',
            body: JSON.stringify(saleData),
        });
    }

    async updateSale(id, saleData) {
        return this.request(`/sales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(saleData),
        });
    }

    async deleteSale(id) {
        return this.request(`/sales/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== INVENTÁRIO =====
    
    async getInventoryMovements() {
        return this.request('/inventory/');
    }

    async getInventoryMovement(id) {
        return this.request(`/inventory/${id}`);
    }

    async createInventoryMovement(movementData) {
        return this.request('/inventory/', {
            method: 'POST',
            body: JSON.stringify(movementData),
        });
    }

    // ===== USUÁRIOS =====
    
    async getUsers() {
        return this.request('/users/');
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async createUser(userData) {
        return this.request('/users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE',
        });
    }
}

// Instância global do serviço de API
const apiService = new ApiService();

export default apiService;
