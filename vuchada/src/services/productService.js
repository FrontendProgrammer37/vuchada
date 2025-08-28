import apiService from './api';

const PRODUCT_ENDPOINT = '/api/v1/products';

const productService = {
  /**
   * Lista todos os produtos com suporte a paginação e filtros
   * @param {Object} params - Parâmetros de consulta
   * @param {number} [params.page=1] - Número da página
   * @param {number} [params.size=10] - Itens por página
   * @param {number} [params.category_id] - Filtrar por categoria
   * @param {string} [params.search] - Busca por nome ou código
   * @returns {Promise<Object>} Lista de produtos e metadados de paginação
   */
  async listProducts({ page = 1, size = 10, category_id, search } = {}) {
    try {
      const queryParams = new URLSearchParams({ page, size });
      
      if (category_id) queryParams.append('category_id', category_id);
      if (search) queryParams.append('search', search);
      
      return await apiService.request(`${PRODUCT_ENDPOINT}/?${queryParams}`);
    } catch (error) {
      console.error('Erro ao listar produtos:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de um produto pelo ID
   * @param {number} productId - ID do produto
   * @returns {Promise<Object>} Dados do produto
   */
  async getProductDetails(productId) {
    try {
      return await apiService.request(`${PRODUCT_ENDPOINT}/${productId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes do produto:', error);
      throw error;
    }
  },

  /**
   * Cria um novo produto
   * @param {Object} productData - Dados do produto
   * @param {string} productData.name - Nome do produto
   * @param {string} productData.code - Código do produto
   * @param {number} productData.price - Preço de venda
   * @param {number} productData.cost_price - Preço de custo
   * @param {number} productData.stock_quantity - Quantidade em estoque
   * @param {number} productData.category_id - ID da categoria
   * @param {string} [productData.barcode] - Código de barras (opcional)
   * @param {string} [productData.description] - Descrição do produto (opcional)
   * @returns {Promise<Object>} Dados do produto criado
   */
  async createProduct(productData) {
    try {
      return await apiService.request(PRODUCT_ENDPOINT, {
        method: 'POST',
        body: productData
      });
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  },

  /**
   * Atualiza os dados de um produto
   * @param {number} productId - ID do produto
   * @param {Object} productData - Dados atualizados do produto
   * @returns {Promise<Object>} Dados do produto atualizado
   */
  async updateProduct(productId, productData) {
    try {
      return await apiService.request(`${PRODUCT_ENDPOINT}/${productId}`, {
        method: 'PUT',
        body: productData
      });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  /**
   * Remove um produto
   * @param {number} productId - ID do produto a ser removido
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteProduct(productId) {
    try {
      return await apiService.request(`${PRODUCT_ENDPOINT}/${productId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  },

  /**
   * Busca produtos por termo de pesquisa
   * @param {string} searchTerm - Termo para busca
   * @param {Object} [options] - Opções adicionais
   * @param {number} [options.limit=10] - Limite de resultados
   * @returns {Promise<Array>} Lista de produtos encontrados
   */
  async searchProducts(searchTerm, { limit = 10 } = {}) {
    try {
      const queryParams = new URLSearchParams({
        search: searchTerm,
        size: limit
      });
      
      const response = await apiService.request(`${PRODUCT_ENDPOINT}/?${queryParams}`);
      return response.items || [];
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  },

  /**
   * Atualiza o estoque de um produto
   * @param {number} productId - ID do produto
   * @param {number} quantity - Quantidade a ser adicionada (pode ser negativo para remover)
   * @returns {Promise<Object>} Dados atualizados do produto
   */
  async updateStock(productId, quantity) {
    try {
      return await apiService.request(`${PRODUCT_ENDPOINT}/${productId}/stock`, {
        method: 'PATCH',
        body: { quantity }
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      throw error;
    }
  }
};

export default productService;
