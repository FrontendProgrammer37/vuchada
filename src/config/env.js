// Configurações de ambiente para o frontend

const ENV = {
  development: {
    // No desenvolvimento, apontamos para o backend local
    API_URL: 'http://localhost:8000/api/v1',
  },
  production: {
    // Em produção, usamos a URL direta da API
    API_URL: 'https://backend-production-f01c.up.railway.app/api/v1',
  },
};

// Determina o ambiente atual baseado na variável de ambiente VITE_APP_ENV
// Se não estiver definida, assume desenvolvimento
const currentEnv = import.meta.env.VITE_APP_ENV || 'development';

// Exporta as configurações do ambiente atual
export default ENV[currentEnv];