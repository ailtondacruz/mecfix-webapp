# MecFix - Setup Initial Guide

## ✅ Status da Implementação

### Frontend (mecfix-webapp)
- [x] Estrutura de pastas criada (por feature)
- [x] TailwindCSS configurado
- [x] Componentes base: Button, Card, Input, Layout
- [x] Tipos compartilhados definidos
- [x] Constantes de rotas e endpoints
- [x] Hook useAuth com contexto
- [x] Hook useApi com axios
- [x] Página de login
- [x] Página de dashboard admin
- [x] Configuração Firebase inicializada
- [ ] Autenticação Google completa
- [ ] PWA Manifest
- [ ] Service Worker

### Backend (mecfix-api)  
- [x] Estrutura NestJS criada
- [x] Firebase Admin SDK inicializado
- [x] Guard de autenticação
- [x] Decorators para usuário e workshopId
- [x] DTOs para todas as features:
  - [x] Auth
  - [x] Workshops
  - [x] Users
  - [x] Customers
  - [x] Vehicles
  - [x] Budgets
  - [x] Financials
- [ ] Serviços (services) para cada feature
- [ ] Controladores (controllers)
- [ ] Repositórios com Firestore
- [ ] Validações avançadas
- [ ] Cloud Functions setup

## 🎯 Próximas Tarefas (Ordem de Prioridade)

### 1. Autenticação Backend (2-3 horas)
- [ ] Criar `AuthService` com Firebase Admin SDK
- [ ] Criar `AuthController` com endpoints:
  - `POST /api/auth/login` - Login com email/senha
  - `POST /api/auth/register` - Registro de novo admin
  - `POST /api/auth/logout` - Logout
- [ ] Implementar JWT com Firebase ID Tokens

### 2. Workshops Feature (2-3 horas)
- [ ] Criar `WorkshopsService` com CRUD
- [ ] Criar `WorkshopsController` com endpoints
- [ ] Implementar isolamento por workshopId

### 3. Autenticação Frontend (1-2 horas)
- [ ] Integrar Firebase Auth no AuthProvider
- [ ] Login com Google
- [ ] Persistência de token
- [ ] Redirect automático por role

### 4. Dashboard Admin (1-2 horas)
- [ ] Conectar API para listar workshops
- [ ] Criar modal para nova oficina
- [ ] Listar oficinas com status
- [ ] Ações: editar, bloquear, ativar

### 5. Remainning Features...

## 🔄 Fluxo de Desenvolvimento Recomendado

1. **API First**
   - Develop backend com todos os endpoints
   - Testar com Insomnia/Postman
   - Implementar guards e validações

2. **Frontend Next**
   - Conectar aos endpoints da API
   - Testar integração
   - Adicionar UI refinada

3. **Testing & Refinement**
   - Testes unitários
   - Testes E2E
   - PWA setup

## 🛠️ Stack Confirmado

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS |
| Backend | NestJS + TypeScript + Firebase Cloud Functions |
| Database | Firestore (multi-tenant) |
| Auth | Firebase Authentication (Google OAuth) |
| Deployment | Firebase Hosting (webapp) + Cloud Functions (API) |

## 📋 Checklist para MVP V1

- [ ] Login funcional (Google)
- [ ] Dashboard admin
- [ ] CRUD de workshops
- [ ] Cadastro de usuários (owner, mechanic, attendant)
- [ ] CRUD de clientes
- [ ] CRUD de veículos
- [ ] Criação de orçamento
- [ ] Geração de PDF
- [ ] Compartilhamento por WhatsApp (link/PDF)
- [ ] Financeiro básico (entradas/saídas)
- [ ] Exportação mensal em CSV/PDF
- [ ] PWA funcional
- [ ] Responsivo (mobile + desktop)

---

**Última atualização**: 2026-05-10
**Status**: Fase 1 - Estrutura Base ✅ | Próxima: Autenticação Backend
