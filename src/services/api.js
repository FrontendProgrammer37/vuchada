// Serviço de API para conectar com o backend
import config from '../config/env';

class ApiService {
    constructor() {
        this.baseURL = config.API_URL; // Já inclui /api/v1 no ambiente de produção
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
        // Remove a barra inicial se existir para evitar duplicação
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = `${this.baseURL}/${normalizedEndpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            // Se a resposta não for OK, lança um erro
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.message || 'Erro na requisição');
                error.status = response.status;
                error.data = errorData;
                throw error;
            }

            // Tenta fazer o parse da resposta como JSON
            try {
                return await response.json();
            } catch (e) {
                return {}; // Retorna um objeto vazio se não houver conteúdo JSON
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ===== AUTENTICAÇÃO =====
    
    async register(userData) {
        return this.request('auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        // O endpoint de login espera 'x-www-form-urlencoded', então não usamos o header padrão
        const data = await this.request('auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        this.setToken(data.access_token);
        return data;
    }

    async logout() {
        this.removeToken();
    }

    async getCurrentUser() {
        return this.request('auth/me');
    }

    // ===== CATEGORIAS =====
    
    async getCategories() {
        return this.request('categories/');
    }

    async getCategory(id) {
        return this.request(`categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.request('categories/', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    async updateCategory(id, categoryData) {
        return this.request(`categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    }

    async deleteCategory(id) {
        return this.request(`categories/${id}`, {
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
        const endpoint = `products/${queryString ? `?${queryString}` : ''}`;
        
        const data = await this.request(endpoint);
        
        // Mapear os campos do backend para o formato esperado pelo frontend
        return data.map(product => ({
            id: product.id,
            name: product.nome,
            description: product.descricao,
            sku: product.codigo,
            cost_price: parseFloat(product.preco_compra) || 0,
            sale_price: parseFloat(product.preco_venda) || 0,
            current_stock: product.estoque || 0,
            min_stock: product.estoque_minimo || 0,
            category_id: product.category_id,
            venda_por_peso: product.venda_por_peso || false,
            is_active: product.is_active !== false
        }));
    }

    async getProduct(id) {
        const product = await this.request(`products/${id}`);
        
        // Mapear os campos do backend para o formato esperado pelo frontend
        return {
            id: product.id,
            name: product.nome,
            description: product.descricao,
            sku: product.codigo,
            cost_price: parseFloat(product.preco_compra) || 0,
            sale_price: parseFloat(product.preco_venda) || 0,
            current_stock: product.estoque || 0,
            min_stock: product.estoque_minimo || 0,
            category_id: product.category_id,
            venda_por_peso: product.venda_por_peso || false,
            is_active: product.is_active !== false
        };
    }

    async createProduct(productData) {
        // Converter do formato do frontend para o formato do backend
        const formattedData = {
            nome: productData.name || '',
            descricao: productData.description || null,
            codigo: productData.sku || null,
            preco_compra: (productData.cost_price || 0).toString(),
            preco_venda: (productData.sale_price || 0).toString(),
            estoque: parseInt(productData.current_stock) || 0,
            estoque_minimo: parseInt(productData.min_stock) || 0,
            category_id: productData.category_id || null,
            venda_por_peso: Boolean(productData.venda_por_peso),
            is_active: true  // Adicionando o campo is_active como true por padrão
        };

        return this.request('products/', {
            method: 'POST',
            body: JSON.stringify(formattedData),
        });
    }

    async updateProduct(id, productData) {
        // Converter do formato do frontend para o formato do backend
        const formattedData = {
            nome: productData.name || '',
            descricao: productData.description || null,
            codigo: productData.sku || null,
            preco_compra: (productData.cost_price || 0).toString(),
            preco_venda: (productData.sale_price || 0).toString(),
            estoque: parseInt(productData.current_stock) || 0,
            estoque_minimo: parseInt(productData.min_stock) || 0,
            category_id: productData.category_id || null,
            venda_por_peso: Boolean(productData.venda_por_peso),
            is_active: productData.is_active !== false
        };

        return this.request(`products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formattedData),
        });
    }

    async deleteProduct(id) {
        return this.request(`products/${id}`, {
            method: 'DELETE',
        });
    }

    async deleteAllProducts() {
        return this.request('products/delete-all', {
            method: 'DELETE',
        });
    }

    // ===== FUNCIONÁRIOS =====
    
    /**
     * Lista todos os funcionários com suporte a paginação
     * @param {Object} params - Parâmetros de paginação
     * @param {number} [params.page=1] - Número da página
     * @param {number} [params.size=10] - Itens por página
     * @returns {Promise<Object>} Lista de funcionários e metadados de paginação
     */
    async getEmployees({ page = 1, size = 10 } = {}) {
        const query = new URLSearchParams({ page, size });
        return this.request(`employees/?${query}`);
    }

    /**
     * Obtém os detalhes de um funcionário
     * @param {number|string} id - ID do funcionário
     * @returns {Promise<Object>} Dados do funcionário
     */
    async getEmployee(id) {
        return this.request(`employees/${id}`);
    }

    /**
     * Cria um novo funcionário
     * @param {Object} employeeData - Dados do funcionário
     * @param {string} employeeData.full_name - Nome completo
     * @param {string} employeeData.username - Nome de usuário
     * @param {string} employeeData.password - Senha
     * @param {number} employeeData.salary - Salário
     * @param {boolean} employeeData.is_admin - Se é administrador
     * @param {boolean} employeeData.can_sell - Pode realizar vendas
     * @param {boolean} employeeData.can_manage_inventory - Pode gerenciar estoque
     * @param {boolean} employeeData.can_manage_expenses - Pode gerenciar despesas
     * @returns {Promise<Object>} Dados do funcionário criado
     */
    async createEmployee(employeeData) {
        return this.request('employees/', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        });
    }

    /**
     * Atualiza um funcionário existente
     * @param {number|string} id - ID do funcionário
     * @param {Object} employeeData - Dados atualizados do funcionário
     * @returns {Promise<Object>} Dados do funcionário atualizado
     */
    async updateEmployee(id, employeeData) {
        return this.request(`employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData)
        });
    }

    /**
     * Remove um funcionário (soft delete)
     * @param {number|string} id - ID do funcionário
     * @returns {Promise<Object>} Resultado da operação
     */
    async deleteEmployee(id) {
        return this.request(`employees/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== VENDAS =====
    
    async getSales() {
        return this.request('sales/');
    }

    async getSale(id) {
        return this.request(`sales/${id}`);
    }

    async createSale(saleData) {
        // Remover referência ao cliente se existir
        const { customer_id, ...saleDataSemCliente } = saleData;
        return this.request('sales/', {
            method: 'POST',
            body: JSON.stringify(saleDataSemCliente),
        });
    }

    async updateSale(id, saleData) {
        return this.request(`sales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(saleData),
        });
    }

    async deleteSale(id) {
        return this.request(`sales/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== INVENTÁRIO =====
    
    async getInventoryMovements() {
        return this.request('inventory/');
    }

    async getInventoryMovement(id) {
        return this.request(`inventory/${id}`);
    }

    async createInventoryMovement(movementData) {
        return this.request('inventory/', {
            method: 'POST',
            body: JSON.stringify(movementData),
        });
    }

    // ===== USUÁRIOS =====
    
    async getUsers() {
        return this.request('users/');
    }

    async getUser(id) {
        return this.request(`users/${id}`);
    }

    async createUser(userData) {
        return this.request('users/', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async updateUser(id, userData) {
        return this.request(`users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async deleteUser(id) {
        return this.request(`users/${id}`, {
            method: 'DELETE',
        });
    }

    // ===== IMPRESSÃO =====
    
    async printReceipt(saleId) {
        return this.request(`sales/${saleId}/print`, {
            method: 'POST',
        });
    }
}

// Instância global do serviço de API
const apiService = new ApiService();

export default apiService;
