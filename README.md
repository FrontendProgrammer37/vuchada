# Sistema PDV - Frontend Web

Sistema de gestão comercial com painel administrativo web para gerenciar produtos, funcionários e relatórios de vendas.

## 🚀 Tecnologias Utilizadas

- **React 18** - Framework JavaScript para interface
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router DOM** - Roteamento da aplicação
- **Lucide React** - Ícones modernos
- **Context API** - Gerenciamento de estado global

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── pages/              # Páginas da aplicação
├── contexts/           # Contextos React (Auth)
├── services/           # Serviços e APIs (futuro)
├── utils/              # Utilitários e helpers
└── hooks/              # Hooks customizados (futuro)
```

## ✨ Funcionalidades Implementadas

### 🔐 Sistema de Autenticação
- **Login responsivo** com layout otimizado para desktop e mobile
- **Context de autenticação** com gerenciamento de estado
- **Proteção de rotas** para usuários não autenticados
- **Persistência de sessão** via localStorage

### 📊 Dashboard
- **Estatísticas em tempo real** (vendas, receita, produtos)
- **Formatação em Metical (MT)** - Moeda de Moçambique
- **Indicadores de crescimento** com comparações
- **Vendas recentes** com histórico detalhado
- **Informações do negócio** localizado em Moçambique

### 🛍️ Gestão de Produtos
- **Campos completos** alinhados com o sistema desktop:
  - Código, Nome, Descrição, Categoria
  - Preço Custo e Preço Venda (em MT)
  - Estoque Atual e Estoque Mínimo
  - Venda por Peso (switch)
  - Fornecedor
- **Filtros avançados** por categoria e fornecedor
- **Tabela responsiva** com indicadores visuais de estoque
- **Modal completo** para adicionar/editar produtos
- **Alertas visuais** para produtos com estoque baixo

### 👥 Gestão de Funcionários
- **Campos completos** alinhados com o sistema desktop:
  - Nome, Usuário, Senha
  - Salário (em MT), Cargo, Status
  - Telefone, Endereço, Data de Admissão
  - Administrador do Sistema (switch)
- **Filtros por cargo e status**
- **Tabela com informações de contato**
- **Modal completo** para adicionar/editar funcionários
- **Indicadores visuais** de status (Ativo, Inativo, Férias, Licença)

### 🎨 Design System
- **Cores consistentes** com o sistema desktop (azul-900)
- **Layout responsivo** otimizado para mobile e desktop
- **Componentes reutilizáveis** com Tailwind CSS
- **Ícones Lucide** para melhor UX
- **Tipografia hierárquica** e espaçamentos consistentes

## 🌍 Adaptação para Moçambique

### 💰 Moeda
- **Metical (MT)** em vez de Real (R$)
- **Formatação local** pt-MZ para números e datas
- **Valores realistas** para o mercado moçambicano

### 📍 Localização
- **Endereços moçambicanos** (Maputo, Beira, Nampula, etc.)
- **Telefones** com código +258
- **Cidades e ruas** características de Moçambique

### 🏢 Contexto Comercial
- **Produtos típicos** do mercado local
- **Preços em Metical** adequados à realidade
- **Categorias** relevantes para o contexto

## 🚀 Como Executar

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Acesso
- **URL**: http://localhost:5173
- **Credenciais de teste**: Qualquer usuário e senha

## 📱 Responsividade

### 🖥️ Desktop
- **Layout de duas colunas** para login
- **Tabelas completas** com todas as informações
- **Modais amplos** para formulários

### 📱 Mobile
- **Layout empilhado** para melhor usabilidade
- **Navegação otimizada** com sidebar colapsável
- **Formulários adaptados** para telas pequenas
- **Filtros organizados** em grid responsivo

## 🔄 Sincronização com Sistema Desktop

### ✅ Campos Alinhados
- **Produtos**: Todos os campos do `produtos_view.py`
- **Funcionários**: Todos os campos do `usuarios_view.py`
- **Formatação**: Metical (MT) como no sistema desktop

### 🔗 Futuras Integrações
- **API REST** para sincronização bidirecional
- **Sincronização automática** quando online
- **Histórico de mudanças** para auditoria

## 🚧 Próximos Passos

### Frontend
- [ ] Implementar gráficos com Chart.js
- [ ] Adicionar paginação nas tabelas
- [ ] Upload de imagens para produtos
- [ ] Notificações toast
- [ ] Tema escuro

### Backend (Fase 2)
- [ ] API REST com FastAPI ou Node.js
- [ ] Banco PostgreSQL/MySQL
- [ ] Autenticação JWT
- [ ] Documentação Swagger/OpenAPI

### Sincronização (Fase 3)
- [ ] Adaptar PDV desktop para API
- [ ] Sistema de sincronização offline/online
- [ ] Gestão de conflitos de dados
- [ ] Logs de sincronização

## 🎯 Objetivos do Projeto

1. **Painel administrativo web** para gestão remota
2. **Sincronização bidirecional** com PDV desktop
3. **Multi-loja** para futuras expansões
4. **Código modular e escalável** para manutenção
5. **UX consistente** entre web e desktop

## 📝 Notas Técnicas

- **Estado local** para demonstração (será substituído por API)
- **Formulários controlados** com validação
- **Componentes funcionais** com hooks React
- **CSS utilitário** com Tailwind para manutenibilidade
- **Estrutura preparada** para integração com backend

---

**Desenvolvido para o Sistema PDV Neotrix - Moçambique** 🇲🇿
