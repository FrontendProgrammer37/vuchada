// Configurações de ambiente para o frontend

const ENV = {
  development: {
    API_URL: 'http://localhost:8000',
  },
  production: {
    API_URL: 'https://backend-production-f01c.up.railway.app',
  },
};

// Determina o ambiente atual baseado na variável de ambiente VITE_APP_ENV
// Se não estiver definida, assume desenvolvimento
const currentEnv = import.meta.env.VITE_APP_ENV || 'development';

// Exporta as configurações do ambiente atual
export default ENV[currentEnv];