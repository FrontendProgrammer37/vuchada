// Configurações de ambiente para o frontend

const ENV = {
  development: {
    // No desenvolvimento, usamos o proxy configurado no Vite
    API_URL: '/api',
  },
  production: {
    // Em produção, usamos a URL direta da API
    API_URL: 'https://backend-production-f01c.up.railway.app/api/v1',
  }
};

// Verifica se estamos em desenvolvimento ou produção
const env = import.meta.env.DEV ? 'development' : 'production';

// Exporta as configurações do ambiente atual
export default ENV[env];