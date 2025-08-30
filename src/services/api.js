// Serviço de API para conectar com o backend
import config from '../config/env';

class ApiService {
    constructor() {
        this.baseURL = config.API_URL;
        this.token = localStorage.getItem('token');
    }

    // Configurar headers com token de autenticação
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
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

    // Método genérico para fazer requisições
    async request(endpoint, options = {}) {
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = `${this.baseURL}${this.baseURL.endsWith('/') ? '' : '/'}${normalizedEndpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(),
            ...options,
            mode: 'cors',
            credentials: 'include',
        };

        // Se o body for um objeto, converte para JSON
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            // Se a resposta for 204 (No Content), retorna null
            if (response.status === 204) {
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Erro na requisição');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            throw error;
        }
    }

    // Métodos HTTP
    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // ===== AUTENTICAÇÃO =====
    
    async register(userData) {
        return this.post('auth/register', userData);
    }

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        // O endpoint de login espera 'x-www-form-urlencoded', então não usamos o header padrão
        const data = await this.post('auth/login', formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        this.setToken(data.access_token);
        return data;
    }

    async logout() {
        this.removeToken();
    }

    async getCurrentUser() {
        return this.get('auth/me');
    }

    // ===== CATEGORIAS =====
    
    async getCategories() {
        return this.get('categories/');
    }

    async getCategory(id) {
        return this.get(`categories/${id}`);
    }

    async createCategory(categoryData) {
        return this.post('categories/', categoryData);
    }

    async updateCategory(id, categoryData) {
        return this.put(`categories/${id}`, categoryData);
    }

    async deleteCategory(id) {
        return this.delete(`categories/${id}`);
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
        
        const data = await this.get(endpoint);
        
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
        const product = await this.get(`products/${id}`);
        
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
        // Validate required fields
        if (!productData.name) {
            throw new Error('O nome do produto é obrigatório');
        }
        if (!productData.sku) {
            throw new Error('O código SKU é obrigatório');
        }
        if (!productData.category_id) {
            throw new Error('A categoria é obrigatória');
        }

        // Convert frontend format to backend format
        const formattedData = {
            codigo: productData.sku.toString().trim(),
            category_id: parseInt(productData.category_id),
            nome: productData.name.trim(),
            descricao: productData.description ? productData.description.trim() : null,
            preco_compra: parseFloat(productData.cost_price) || 0,
            preco_venda: parseFloat(productData.sale_price) || 0,
            estoque: parseInt(productData.current_stock) || 0,
            estoque_minimo: parseInt(productData.min_stock) || 0,
            venda_por_peso: Boolean(productData.venda_por_peso)
        };

        console.log('Enviando dados para a API:', JSON.stringify(formattedData, null, 2));

        try {
            const response = await this.post('products/', formattedData);
            console.log('Resposta da API:', response);
            return response;
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            throw new Error(`Falha ao criar produto: ${error.message}`);
        }
    }

    async updateProduct(id, productData) {
        // Validações iniciais
        if (!id) {
            throw new Error('ID do produto é obrigatório para atualização');
        }
        if (!productData) {
            throw new Error('Dados do produto são obrigatórios');
        }

        // Validar campos obrigatórios
        if (!productData.name) {
            throw new Error('O nome do produto é obrigatório');
        }
        if (!productData.sku) {
            throw new Error('O código SKU é obrigatório');
        }
        if (!productData.category_id) {
            throw new Error('A categoria é obrigatória');
        }

        // Converter do formato do frontend para o formato do backend
        const formattedData = {
            codigo: productData.sku.toString().trim(),
            category_id: parseInt(productData.category_id),
            nome: productData.name.trim(),
            descricao: productData.description ? productData.description.trim() : null,
            preco_compra: parseFloat(productData.cost_price) || 0,
            preco_venda: parseFloat(productData.sale_price) || 0,
            estoque: parseInt(productData.current_stock) || 0,
            estoque_minimo: parseInt(productData.min_stock) || 0,
            venda_por_peso: Boolean(productData.venda_por_peso)
        };

        console.log('Enviando dados para atualização:', JSON.stringify({
            id,
            ...formattedData
        }, null, 2));

        try {
            const response = await this.put(`products/${id}`, formattedData);
            
            console.log('Produto atualizado com sucesso:', response);
            return response;
            
        } catch (error) {
            console.error('Erro ao atualizar produto:', {
                id,
                error: error.message,
                status: error.status,
                response: error.response
            });
            throw new Error(`Falha ao atualizar produto: ${error.message}`);
        }
    }

    async deleteProduct(id) {
        // Validação do ID
        if (!id) {
            throw new Error('ID do produto é obrigatório para exclusão');
        }

        console.log(`Solicitando exclusão do produto com ID: ${id}`);

        try {
            const response = await this.delete(`products/${id}`);
            
            console.log('Produto excluído com sucesso:', response);
            return response;
            
        } catch (error) {
            console.error('Erro ao excluir produto:', {
                id,
                error: error.message,
                status: error.status,
                response: error.response
            });
            throw new Error(`Falha ao excluir produto: ${error.message}`);
        }
    }

    async deleteAllProducts() {
        return this.delete('products/delete-all');
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
        return this.get(`employees/?${query}`);
    }

    /**
     * Obtém os detalhes de um funcionário
     * @param {number|string} id - ID do funcionário
     * @returns {Promise<Object>} Dados do funcionário
     */
    async getEmployee(id) {
        return this.get(`employees/${id}`);
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
        return this.post('employees/', employeeData);
    }

    /**
     * Atualiza um funcionário existente
     * @param {number|string} id - ID do funcionário
     * @param {Object} employeeData - Dados atualizados do funcionário
     * @returns {Promise<Object>} Dados do funcionário atualizado
     */
    async updateEmployee(id, employeeData) {
        return this.put(`employees/${id}`, employeeData);
    }

    /**
     * Remove um funcionário (soft delete)
     * @param {number|string} id - ID do funcionário
     * @returns {Promise<Object>} Resultado da operação
     */
    async deleteEmployee(id) {
        return this.delete(`employees/${id}`);
    }

    // ===== VENDAS =====
    
    async getSales() {
        return this.get('sales/');
    }

    async getSale(id) {
        return this.get(`sales/${id}`);
    }

    async createSale(saleData) {
        // Remover referência ao cliente se existir
        const { customer_id, ...saleDataSemCliente } = saleData;
        return this.post('sales/', saleDataSemCliente);
    }

    async updateSale(id, saleData) {
        return this.put(`sales/${id}`, saleData);
    }

    async deleteSale(id) {
        return this.delete(`sales/${id}`);
    }

    // ===== INVENTÁRIO =====
    
    async getInventoryMovements() {
        return this.get('inventory/');
    }

    async getInventoryMovement(id) {
        return this.get(`inventory/${id}`);
    }

    async createInventoryMovement(movementData) {
        return this.post('inventory/', movementData);
    }

    // ===== USUÁRIOS =====
    
    async getUsers() {
        return this.get('users/');
    }

    async getUser(id) {
        return this.get(`users/${id}`);
    }

    async createUser(userData) {
        return this.post('users/', userData);
    }

    async updateUser(id, userData) {
        return this.put(`users/${id}`, userData);
    }

    async deleteUser(id) {
        return this.delete(`users/${id}`);
    }

    // ===== IMPRESSÃO =====
    
    async printReceipt(saleId) {
        return this.post(`sales/${saleId}/print`);
    }
}

// Instância global do serviço de API
const apiService = new ApiService();

export default apiService;
