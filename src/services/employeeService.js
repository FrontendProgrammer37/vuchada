import apiService from './api';

const EMPLOYEE_ENDPOINT = '/api/v1/employees';

const employeeService = {
  /**
   * Lista todos os funcionários com suporte a paginação
   * @param {Object} params - Parâmetros de paginação e filtros
   * @param {number} [params.page=1] - Número da página
   * @param {number} [params.size=10] - Itens por página
   * @returns {Promise<Object>} Lista de funcionários e metadados de paginação
   */
  async listEmployees({ page = 1, size = 10 } = {}) {
    try {
      const queryParams = new URLSearchParams({ page, size });
      return await apiService.request(`${EMPLOYEE_ENDPOINT}/?${queryParams}`);
    } catch (error) {
      console.error('Erro ao listar funcionários:', error);
      throw error;
    }
  },

  /**
   * Cria um novo funcionário
   * @param {Object} employeeData - Dados do funcionário
   * @param {string} employeeData.full_name - Nome completo do funcionário
   * @param {string} employeeData.username - Nome de usuário
   * @param {string} employeeData.password - Senha do usuário
   * @param {number} employeeData.salary - Salário do funcionário
   * @param {boolean} employeeData.is_admin - Se é administrador
   * @param {boolean} employeeData.can_sell - Se pode realizar vendas
   * @param {boolean} employeeData.can_manage_inventory - Se pode gerenciar estoque
   * @param {boolean} employeeData.can_manage_expenses - Se pode gerenciar despesas
   * @returns {Promise<Object>} Dados do funcionário criado
   */
  async createEmployee(employeeData) {
    try {
      return await apiService.request(EMPLOYEE_ENDPOINT, {
        method: 'POST',
        body: employeeData
      });
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  },

  /**
   * Atualiza os dados de um funcionário
   * @param {number} employeeId - ID do funcionário
   * @param {Object} employeeData - Dados atualizados do funcionário
   * @returns {Promise<Object>} Dados do funcionário atualizado
   */
  async updateEmployee(employeeId, employeeData) {
    try {
      return await apiService.request(`${EMPLOYEE_ENDPOINT}/${employeeId}`, {
        method: 'PUT',
        body: employeeData
      });
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  },

  /**
   * Remove um funcionário (soft delete)
   * @param {number} employeeId - ID do funcionário a ser removido
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteEmployee(employeeId) {
    try {
      return await apiService.request(`${EMPLOYEE_ENDPOINT}/${employeeId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      throw error;
    }
  },

  /**
   * Obtém os detalhes de um funcionário
   * @param {number} employeeId - ID do funcionário
   * @returns {Promise<Object>} Dados do funcionário
   */
  async getEmployeeDetails(employeeId) {
    try {
      return await apiService.request(`${EMPLOYEE_ENDPOINT}/${employeeId}`);
    } catch (error) {
      console.error('Erro ao obter detalhes do funcionário:', error);
      throw error;
    }
  }
};

export default employeeService;
