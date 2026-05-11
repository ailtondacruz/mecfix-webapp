# MecFix - Plataforma Multi-Tenant para Oficinas Mecânicas

## 🎯 Visão Geral

MecFix é uma plataforma SaaS para oficinas mecânicas que permite:
- Gestão de orçamentos e ordens de serviço
- Controle financeiro simples
- Exportação de dados para contabilidade
- Multi-tenant com isolamento de dados por oficina

## 📦 Estrutura do Projeto

```
mecfix/
├── mecfix-webapp/          # Frontend React + Vite + TailwindCSS
│   └── src/
│       ├── features/       # Features por domínio
│       │   ├── auth/       # Autenticação
│       │   ├── admin/      # Painel administrativo
│       │   └── workshop/   # Painel da oficina
│       ├── shared/         # Componentes, hooks, tipos compartilhados
│       ├── services/       # Integração com Firebase e API
│       └── store/          # Zustand stores (futura implementação)
│
└── mecfix-api/             # Backend NestJS + Firebase Functions
    └── src/
        ├── features/       # Features por domínio
        │   ├── auth/       # Autenticação
        │   ├── workshops/  # Gestão de oficinas
        │   ├── users/      # Gestão de usuários
        │   ├── customers/  # Gestão de clientes
        │   ├── vehicles/   # Gestão de veículos
        │   ├── budgets/    # Módulo de orçamentos
        │   └── financials/ # Módulo financeiro
        ├── common/         # Guards, decorators, filters, utilities
        ├── firebase/       # Configuração do Firebase Admin SDK
        ├── config/         # Configurações globais
        └── functions/      # Cloud Functions entry point
```

## 🚀 Iniciando

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Firebase (Blaze plan)

### 1. Frontend (mecfix-webapp)

```bash
cd mecfix-webapp

# Instale as dependências (já instaladas)
npm install

# Configure o arquivo .env
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Inicie o dev server
npm run dev
```

Acesse em: `http://localhost:5173`

### 2. Backend (mecfix-api)

```bash
cd mecfix-api

# Instale as dependências (já instaladas)
npm install

# Configure o arquivo .env
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Inicie o servidor em desenvolvimento
npm run start:dev
```

O servidor rodará em: `http://localhost:3000`

## 🔧 Configuração Firebase

### Webapp
1. Crie um projeto no Firebase Console
2. Ative Authentication (Google Sign-In)
3. Crie um Firestore Database
4. Copie as credenciais em "Project Settings"
5. Preencha `.env` na webapp com as credenciais

### API
1. Gere uma chave privada em Firebase Console → Project Settings → Service Accounts
2. Copie o JSON e configure em `.env` da API

## 📊 Modelo de Dados (Firestore)

### Estrutura Multi-Tenant

Todos os dados são isolados por `workshopId`:

```
/workshops
  /{workshopId}
    /users
      /{userId}
    /customers
      /{customerId}
    /vehicles
      /{vehicleId}
    /budgets
      /{budgetId}
    /financials
      /{financialId}
```

## 🔐 Autenticação

- **Frontend**: Firebase Authentication (Google OAuth)
- **Backend**: JWT com Firebase ID Tokens
- **Guard**: `AuthGuard` em todos os endpoints protegidos

## 📝 Próximos Passos

1. **Fase 1** (Atual):
   - [x] Estrutura de pastas
   - [x] Configuração Firebase
   - [x] Componentes base UI
   - [ ] Autenticação Google
   - [ ] Endpoints da API

2. **Fase 2**:
   - [ ] PDF de orçamentos
   - [ ] Compartilhamento por WhatsApp
   - [ ] Dashboard da oficina

3. **Fase 3**:
   - [ ] Financeiro completo
   - [ ] Exportação para contabilidade

4. **Fase 4**:
   - [ ] Assinatura recorrente
   - [ ] Dashboard administrativo completo

## 🎨 Identidade Visual

- **Cor Primária**: Laranja (#FF8C00)
- **Cor Secundária**: Azul Marinho (#001F3F)
- **Tipografia**: Inter (sistema-ui)

## 💡 Arquitetura

### Princípios

1. **Regras de Negócio 100% no Backend**
   - Frontend é responsável apenas por apresentação
   - Validações, cálculos e lógica no servidor

2. **Multi-Tenant Desde o Início**
   - Isolamento por `workshopId` em todas as queries
   - Permissões baseadas em role (admin, owner, mechanic, attendant)

3. **PWA Responsivo**
   - Funciona em Windows, Linux, iPhone e Android
   - Layout responsivo para web e mobile

## 📚 Documentação

Para mais detalhes sobre features específicas, veja:
- [Autenticação](./docs/AUTH.md) (futuro)
- [API Endpoints](./docs/API.md) (futuro)
- [Firestore Schema](./docs/SCHEMA.md) (futuro)

## 📄 Licença

UNLICENSED

## 👨‍💻 Autor

Seu Nome aqui
