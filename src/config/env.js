// Configurações de ambiente para o frontend

const ENV = {
  development: {
    // No desenvolvimento, usamos o proxy configurado no Vite
    API_URL: 'http://localhost:5173',
  },
  production: {
    // Em produção, usamos a URL direta da API com HTTPS
    API_URL: 'https://backend-production-f01c.up.railway.app',
  },
};

// Determina o ambiente atual baseado na variável de ambiente VITE_APP_ENV
// Se não estiver definida, assume desenvolvimento
const currentEnv = import.meta.env.VITE_APP_ENV || 'development';

// Exporta as configurações do ambiente atual
export default ENV[currentEnv];