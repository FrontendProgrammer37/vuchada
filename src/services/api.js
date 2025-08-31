// Serviço de API para conectar com o backend
import config from '../config/env';

class ApiService {
    constructor() {
        this.baseURL = config.API_URL; // Já inclui /api/v1 no ambiente de produção
        this.token = localStorage.getItem('token');
        this.sessionId = localStorage.getItem('sessionId') || this.generateSessionId();
    }

    // Gerar um ID de sessão único
    generateSessionId() {
        const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sessionId', sessionId);
        return sessionId;
    }

    // Configurar headers com token de autenticação e session ID
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId
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
        // Ensure endpoint is a string before calling string methods
        const endpointStr = String(endpoint || '');
        // Remove a barra inicial se existir para evitar duplicação
        const normalizedEndpoint = endpointStr.startsWith('/') ? endpointStr.substring(1) : endpointStr;
        const url = `${this.baseURL}/${normalizedEndpoint}`;
        
        const config = {
            method: 'GET',
            headers: this.getHeaders(),
            ...options,
            mode: 'cors', // Força o modo CORS
            credentials: 'include', // Inclui credenciais se necessário
        };

        // Se tiver corpo na requisição, converte para JSON
        if (options.body) {
            config.body = JSON.stringify(options.body);
            config.headers = {
                ...config.headers,
                'Content-Type': 'application/json'
            };
        }

        try {
            const response = await fetch(url, config);
            
            // Se a resposta for 204 (No Content), retorna null
            if (response.status === 204) {
                return null;
            }

            // Tenta fazer o parse da resposta como JSON
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                const error = new Error(
                    (responseData && (responseData.detail || responseData.message)) || 
                    'Erro na requisição'
                );
                error.status = response.status;
                error.response = responseData;
                throw error;
            }

            return responseData;
        } catch (error) {
            console.error('Erro na requisição:', {
                url,
                error: error.message,
                status: error.status,
                response: error.response
            });
            
            // Se for um erro de rede, adiciona um status
            if (!error.status) {
                error.status = 0; // Network error
            }
            
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
        const data = await this.request('auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
                grant_type: 'password',
                client_id: 'web',
                client_secret: 'web-secret'
            }),
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
            const response = await this.request('products/', {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(formattedData),
            });
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
            const response = await this.request(`products/${id}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(formattedData),
            });
            
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
            const response = await this.request(`products/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            
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
    
    async getSales({ skip = 0, limit = 100 } = {}) {
        const params = new URLSearchParams();
        if (skip) params.append('skip', skip);
        if (limit) params.append('limit', limit);
        
        const queryString = params.toString();
        const endpoint = `sales/${queryString ? `?${queryString}` : ''}`;
        
        return this.request(endpoint);
    }

    async getSale(id) {
        return this.request(`sales/${id}`);
    }

    async createSale(saleData) {
        return this.request('sales/', {
            method: 'POST',
            body: JSON.stringify(saleData),
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

    async printReceipt(saleId) {
        return this.request(`sales/${saleId}/receipt`, {
            method: 'GET',
            headers: {
                ...this.getHeaders(),
                'Accept': 'application/pdf',
            },
            responseType: 'blob', // Para lidar com a resposta binária do PDF
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

    // Clear cart
    async clearCart() {
        try {
            console.log('Clearing cart...');
            const response = await this.request('cart', {
                method: 'DELETE'
            });
            console.log('Cart cleared successfully:', response);
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            }
            // Continue even if clear fails
            return false;
        }
    }
}

// Instância global do serviço de API
const apiService = new ApiService();

export default apiService;
