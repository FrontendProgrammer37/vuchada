# Documentação de Integração Backend-Frontend

## Introdução

Este documento descreve os requisitos e especificações para a integração do backend com o frontend do sistema PDV. O objetivo é garantir que o backend forneça dados consistentes e válidos para o frontend, seguindo os padrões estabelecidos.

## Autenticação

### POST /api/auth/login
- **Descrição**: Autentica um usuário e retorna um token JWT
- **Request**:
  ```json
  {
    "username": "usuario",
    "password": "senha123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "token": "jwt.token.here",
    "user": {
      "id": 1,
      "name": "Nome do Usuário",
      "username": "usuario",
      "email": "usuario@exemplo.com",
      "is_admin": true,
      "can_supply": false
    }
  }
  ```

## Produtos

### GET /api/products
- **Descrição**: Lista produtos com suporte a filtros e paginação
- **Query Params**:
  - `search`: Filtra por nome ou SKU
  - `category_id`: Filtra por categoria
  - `page`: Número da página (padrão: 1)
  - `per_page`: Itens por página (padrão: 20)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Produto de Exemplo",
        "description": "Descrição do produto",
        "sku": "COD123",
        "cost_price": 10.50,
        "sale_price": 19.90,
        "current_stock": 100,
        "min_stock": 10,
        "category_id": 1,
        "venda_por_peso": false,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-01-01T00:00:00Z"
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 100,
      "total_pages": 5
    }
  }
  ```

### POST /api/products
- **Descrição**: Cria um novo produto
- **Request**:
  ```json
  {
    "name": "Novo Produto",
    "description": "Descrição do novo produto",
    "sku": "COD124",
    "cost_price": 15.75,
    "sale_price": 29.90,
    "current_stock": 50,
    "min_stock": 5,
    "category_id": 1,
    "venda_por_peso": false
  }
  ```
- **Response (201 Created)**: Retorna o produto criado

## Vendas

### GET /api/sales
- **Descrição**: Lista vendas com filtros
- **Query Params**:
  - `start_date`: Data inicial (YYYY-MM-DD)
  - `end_date`: Data final (YYYY-MM-DD)
  - `status`: Status da venda
  - `page`: Número da página
  - `per_page`: Itens por página
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "total_amount": 100.50,
        "payment_method": "dinheiro",
        "status": "concluída",
        "created_at": "2023-01-01T12:00:00Z",
        "items": [
          {
            "product_id": 1,
            "product_name": "Produto A",
            "quantity": 2,
            "unit_price": 50.25,
            "subtotal": 100.50
          }
        ]
      }
    ],
    "meta": {
      "current_page": 1,
      "per_page": 20,
      "total_items": 1,
      "total_pages": 1
    }
  }
  ```

### POST /api/sales
- **Descrição**: Cria uma nova venda
- **Request**:
  ```json
  {
    "payment_method": "dinheiro",
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "unit_price": 10.50,
        "discount": 0.00
      }
    ]
  }
  ```
- **Response (201 Created)**: Retorna a venda criada

## Funcionários

### GET /api/employees
- **Descrição**: Lista funcionários
- **Query Params**:
  - `is_admin`: Filtra por administradores
  - `is_active`: Filtra por status ativo/inativo
  - `page`: Número da página
  - `per_page`: Itens por página

### POST /api/employees
- **Descrição**: Cria um novo funcionário
- **Request**:
  ```json
  {
    "name": "Nome Completo",
    "username": "usuario",
    "email": "email@exemplo.com",
    "password": "senha123",
    "is_admin": false,
    "can_supply": true
  }
  ```

## Categorias

### GET /api/categories
- **Descrição**: Lista todas as categorias
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Bebidas",
      "description": "Bebidas em geral"
    }
  ]
  ```

## Padrões e Convenções

1. **Autenticação**:
   - Todas as rotas (exceto login) requerem o header `Authorization: Bearer <token>`
   - Tokens expiram em 24h

2. **Valores Monetários**:
   - Sempre números com 2 casas decimais
   - Números positivos
   - Nenhum valor monetário pode ser nulo

3. **Datas**:
   - Formato ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
   - Fuso horário UTC

4. **Paginação**:
   - Todas as listas são paginadas
   - Parâmetros: `page` e `per_page`
   - Metadados incluídos na resposta

5. **Tratamento de Erros**:
   - 400 Bad Request: Dados inválidos
   - 401 Unauthorized: Token inválido/expirado
   - 403 Forbidden: Permissão negada
   - 404 Not Found: Recurso não encontrado
   - 422 Unprocessable Entity: Erro de validação
   - 500 Internal Server Error: Erro no servidor

   Exemplo de erro:
   ```json
   {
     "error": {
       "code": "validation_error",
       "message": "Dados inválidos",
       "details": {
         "name": ["Campo obrigatório"],
         "email": ["Email inválido"]
       }
     }
   }
   ```

## Considerações de Segurança

1. **Senhas**:
   - Armazenar com hash bcrypt
   - Nunca retornar em respostas

2. **Dados Sensíveis**:
   - Usar HTTPS em produção
   - Não expor informações desnecessárias

3. **Rate Limiting**:
   - Implementar limites de requisições
   - Especialmente para login

## Próximos Passos

1. Implementar documentação Swagger/OpenAPI
2. Adicionar mais testes de integração
3. Implementar cache para melhor desempenho
4. Adicionar logs detalhados
5. Configurar monitoramento e alertas