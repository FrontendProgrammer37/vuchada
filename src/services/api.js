// Serviço de API para conectar com o backend
import config from '../config/env';
const API_BASE_URL = config.API_URL;

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('token');
        this.apiPrefix = '/api/v0';
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
        // Garante que o endpoint comece com / e adiciona o prefixo da API
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${this.apiPrefix}${normalizedEndpoint}`;
        
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.removeToken();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

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
    
    async register(userData) {
        const response = await fetch(`${this.baseURL}${this.apiPrefix}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Falha no registro');
        }

        return await response.json();
    }

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${this.baseURL}${this.apiPrefix}/auth/login`, {
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
    
    async getProducts({ skip = 0, limit = 10, search = '', category_id } = {}) {
        const params = new URLSearchParams();
        if (skip) params.append('skip', skip);
        if (limit) params.append('limit', limit);
        if (search) params.append('search', search);
        if (category_id) params.append('category_id', category_id);
        
        const queryString = params.toString();
        const endpoint = `/products/${queryString ? `?${queryString}` : ''}`;
        
        return this.request(endpoint);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        // Garantir que os dados estejam no formato correto
        const formattedData = {
            name: productData.name,
            description: productData.description || null,
            sku: productData.sku || null,
            cost_price: parseFloat(productData.cost_price) || 0,
            sale_price: parseFloat(productData.sale_price) || 0,
            current_stock: parseInt(productData.current_stock) || 0,
            min_stock: parseInt(productData.min_stock) || 0,
            category_id: productData.category_id || null,
            venda_por_peso: Boolean(productData.venda_por_peso)
        };

        return this.request('/products/', {
            method: 'POST',
            body: JSON.stringify(formattedData),
        });
    }

    async updateProduct(id, productData) {
        // Garantir que os dados estejam no formato correto
        const formattedData = {
            name: productData.name,
            description: productData.description || null,
            sku: productData.sku || null,
            cost_price: parseFloat(productData.cost_price) || 0,
            sale_price: parseFloat(productData.sale_price) || 0,
            current_stock: parseInt(productData.current_stock) || 0,
            min_stock: parseInt(productData.min_stock) || 0,
            category_id: productData.category_id || null,
            venda_por_peso: Boolean(productData.venda_por_peso)
        };

        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formattedData),
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

    // ===== VENDAS =====
    
    async getSales() {
        return this.request('/sales/');
    }

    async getSale(id) {
        return this.request(`/sales/${id}`);
    }

    async createSale(saleData) {
        // Remover referência ao cliente se existir
        const { customer_id, ...saleDataSemCliente } = saleData;
        return this.request('/sales/', {
            method: 'POST',
            body: JSON.stringify(saleDataSemCliente),
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

    // ===== IMPRESSÃO =====
    
    async printReceipt(saleId) {
        return this.request(`/sales/${saleId}/print`, {
            method: 'POST',
        });
    }
}

// Instância global do serviço de API
const apiService = new ApiService();

export default apiService;
