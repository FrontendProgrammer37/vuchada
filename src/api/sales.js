const API_URL = 'https://backend-production-f01c.up.railway.app/api/v1';

export const getSales = async (page = 0, limit = 10) => {
  const response = await fetch(
    `${API_URL}/sales?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Erro ao carregar vendas');
  return await response.json();
};

export const getSaleById = async (saleId) => {
  const response = await fetch(
    `${API_URL}/sales/${saleId}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    }
  );
  if (!response.ok) throw new Error('Erro ao buscar venda');
  return await response.json();
};
