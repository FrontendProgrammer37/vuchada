import apiService from './api';

const adminService = {
    /**
     * Reseta o banco de dados para o estado inicial
     * @returns {Promise<Object>} Resposta da API
     * @throws {Error} Se ocorrer um erro na requisição
     */
    async resetDatabase() {
        try {
            const response = await apiService.request('admin/reset-database', {
                method: 'POST'
            });
            return response;
        } catch (error) {
            console.error('Erro ao resetar o banco de dados:', error);
            
            // Tratamento específico para erros de permissão
            if (error.status === 403) {
                throw new Error('Apenas administradores podem executar esta operação.');
            }
            
            // Tratamento para ambiente de produção
            if (error.message.includes('ambiente de desenvolvimento')) {
                throw new Error('Esta operação só é permitida em ambiente de desenvolvimento.');
            }
            
            throw new Error('Erro ao resetar o banco de dados. Por favor, tente novamente.');
        }
    },
    
    /**
     * Verifica se o usuário atual é administrador
     * @returns {Promise<boolean>} True se for administrador
     */
    async isAdmin() {
        try {
            const user = await apiService.getCurrentUser();
            return user && (user.role === 'admin' || user.is_superuser);
        } catch (error) {
            console.error('Erro ao verificar permissões de administrador:', error);
            return false;
        }
    }
};

export default adminService;
