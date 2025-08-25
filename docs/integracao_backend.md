# Documentação de Integração Backend-Frontend

## Introdução

Este documento descreve os requisitos e especificações para a integração do backend com o frontend do sistema PDV. O objetivo é garantir que o backend forneça dados consistentes e válidos para o frontend, especialmente para a exibição de valores monetários e informações de vendas.

## Requisitos de API para Vendas

### Endpoint de Listagem de Vendas

**URL**: `/api/sales`

**Método**: `GET`

**Parâmetros de Query**:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `start_date`: Data inicial para filtro (formato: YYYY-MM-DD)
- `end_date`: Data final para filtro (formato: YYYY-MM-DD)
- `status`: Status da venda para filtro (concluída, pendente, cancelada)
- `min_value`: Valor mínimo para filtro
- `max_value`: Valor máximo para filtro

**Resposta Esperada**:
```json
{
  "data": [
    {
      "id": "string",
      "total_amount": "number",
      "created_at": "string (ISO date)",
      "updated_at": "string (ISO date)",
      "status": "string (concluída, pendente, cancelada)",
      "items": [
        {
          "id": "string",
          "product_id": "string",
          "product_name": "string",
          "quantity": "number",
          "unit_price": "number",
          "subtotal": "number"
        }
      ]
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "total_pages": "number"
  }
}
```

### Validações Importantes

1. **Valores Monetários**:
   - Todos os valores monetários (`total_amount`, `unit_price`, `subtotal`) devem ser números válidos
   - Não devem ser nulos, indefinidos ou NaN
   - Devem ser enviados como números, não como strings
   - Devem ter precisão de 2 casas decimais

2. **Datas**:
   - Todas as datas devem estar em formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
   - Não devem ser nulas ou indefinidas

3. **Status**:
   - O status deve ser um dos valores permitidos: "concluída", "pendente" ou "cancelada"
   - Não deve ser nulo ou indefinido

4. **IDs**:
   - Todos os IDs devem ser strings válidas
   - Não devem ser nulos ou indefinidos

## Requisitos de API para Dashboard

### Endpoint de Estatísticas

**URL**: `/api/statistics`

**Método**: `GET`

**Parâmetros de Query**:
- `period`: Período para estatísticas (today, week, month, year)

**Resposta Esperada**:
```json
{
  "sales": {
    "count": "number",
    "total": "number"
  },
  "revenue": {
    "today": "number",
    "week": "number",
    "month": "number"
  },
  "profit": {
    "today": "number",
    "week": "number",
    "month": "number"
  },

  "stock": {
    "value": "number",
    "potential_value": "number",
    "potential_profit": "number",
    "count": "number"
  },
  "recent_sales": [
    {
      "id": "string",
      "total_amount": "number",
      "created_at": "string (ISO date)",
      "status": "string"
    }
  ]
}
```

## Tratamento de Erros

### Formato de Resposta de Erro

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (opcional)"
  }
}
```

### Códigos de Status HTTP

- `200 OK`: Requisição bem-sucedida
- `400 Bad Request`: Parâmetros inválidos
- `401 Unauthorized`: Autenticação necessária
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

## Autenticação

### Endpoint de Login

**URL**: `/api/auth/login`

**Método**: `POST`

**Corpo da Requisição**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Resposta Esperada**:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "role": "string"
  }
}
```

### Autenticação de Requisições

Todas as requisições à API (exceto login) devem incluir o token de autenticação no cabeçalho:

```
Authorization: Bearer {token}
```

## Considerações Finais

1. **Validação de Dados**: O backend deve validar todos os dados antes de enviá-los ao frontend para garantir que estejam no formato correto.

2. **Valores Padrão**: Para campos que podem ser nulos ou indefinidos, o backend deve fornecer valores padrão apropriados.

3. **Paginação**: Todos os endpoints que retornam listas devem implementar paginação para melhorar o desempenho.

4. **Cache**: Considere implementar cache para endpoints frequentemente acessados, como estatísticas do dashboard.

5. **Logs**: Implemente logs detalhados para facilitar a depuração de problemas de integração.

6. **Versionamento da API**: Considere implementar versionamento da API para facilitar futuras atualizações sem quebrar a compatibilidade.

7. **Documentação da API**: Mantenha esta documentação atualizada e considere usar ferramentas como Swagger para documentação interativa.