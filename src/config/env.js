// Configurações de ambiente para o frontend

const ENV = {
  development: {
    // No desenvolvimento, usamos o proxy configurado no Vite
    API_URL: '/api',
    // URL completa para redirecionamentos e links que precisam da URL absoluta
    BASE_URL: 'http://localhost:5173',
    // Habilita logs detalhados
    DEBUG: true
  },
  production: {
    // Em produção, usamos a URL direta da API com HTTPS
    API_URL: 'https://backend-production-f01c.up.railway.app/api/v1',
    // URL base para produção
    BASE_URL: 'https://vuchada-cyan.vercel.app',
    // Desabilita logs em produção
    DEBUG: false
  }
};

// Determina o ambiente atual
const env = import.meta.env.DEV ? 'development' : 'production';

// Configuração global de debug
const DEBUG = ENV[env].DEBUG;

// Função de log condicional
const debugLog = (...args) => {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
};

// Exporta as configurações do ambiente atual
const config = {
  ...ENV[env],
  isDevelopment: env === 'development',
  isProduction: env === 'production',
  debug: debugLog
};

export default config;