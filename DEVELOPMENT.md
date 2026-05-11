# MecFix WebApp - Frontend

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Firebase

# Iniciar dev server
npm run dev
```

Acesse: `http://localhost:5173`

## 📁 Estrutura de Pastas

```
src/
├── features/                    # Features por domínio
│   ├── auth/
│   │   ├── components/         # LoginForm, AuthProvider
│   │   ├── pages/              # LoginPage
│   │   ├── hooks/              # useLogin, etc
│   │   └── services/           # authService
│   ├── admin/
│   │   ├── components/         # WorkshopList, Modal, etc
│   │   ├── pages/              # AdminDashboardPage
│   │   └── services/           # workshopsService
│   └── workshop/
│       ├── customers/          # Clientes
│       ├── vehicles/           # Veículos
│       ├── budgets/            # Orçamentos
│       └── financials/         # Financeiro
│
├── shared/
│   ├── components/             # Button, Card, Input, Layout
│   ├── hooks/                  # useAuth, useApi
│   ├── types/                  # Tipos TypeScript
│   ├── constants/              # Rotas, endpoints
│   └── utils/                  # Helpers
│
├── services/                    # Firebase, API clients
├── store/                       # Zustand stores (future)
├── App.tsx                      # Main router
├── main.tsx                     # Entry point
└── tailwind.css                 # Estilos globais
```

## 🎨 Identidade Visual

- **Primária**: Laranja `#FF8C00`
- **Secundária**: Azul Marinho `#001F3F`
- **Light**: `#F5F5F5`
- **Tipografia**: Inter (system-ui)

## 🔧 Desenvolvendo

### Criar um novo componente

```typescript
// src/shared/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return <div className="card">{title}</div>;
}
```

### Criar uma nova feature

```
src/features/myfeature/
├── components/        # Componentes específicos
├── pages/             # Páginas/rotas
├── hooks/             # Hooks customizados
├── services/          # Lógica de API
├── types.ts           # Tipos da feature
└── index.ts           # Barrel export
```

## 📦 Scripts

```bash
npm run dev           # Dev server (Vite)
npm run build         # Build para produção
npm run preview       # Preview do build
npm run lint          # Linting com ESLint
```

## 🔐 Autenticação

### Firebase Auth Setup

1. Vá para [Firebase Console](https://console.firebase.google.com)
2. Criar projeto
3. Ativar Authentication → Google
4. Copiar credenciais

### Fluxo no App

1. Usuário acessa `/auth/login`
2. Clica em "Entrar com Google"
3. Firebase autentica e retorna ID Token
4. Token é enviado para API em cada requisição
5. Se válido, usuário é redirecionado para `/admin` ou `/workshop`

## 🌐 API Integration

### useApi Hook

```typescript
import { useApi } from '@/shared/hooks';

function MyComponent() {
  const { get, post } = useApi();

  const handleFetch = async () => {
    const { data } = await get('/api/workshops');
    console.log(data);
  };

  return <button onClick={handleFetch}>Buscar</button>;
}
```

### Endpoints esperados

Veja [SETUP_STATUS.md](../SETUP_STATUS.md) para lista completa.

## 🚨 Troubleshooting

**Firebase não conecta:**
- Verifique `.env` com credenciais corretas
- Verifique se API está rodando em `http://localhost:3000`

**TypeScript errors:**
- Rode `npm install` novamente
- Delete `node_modules` e reinstale

**Estilos não funcionam:**
- Verifique se `tailwind.css` foi importado em `main.tsx`
- Limpe cache: `npm run build && npm run preview`

## 📚 Próximos Passos

- [ ] Implementar Google Sign-In
- [ ] Conectar API de autenticação
- [ ] Criar dashboard da oficina
- [ ] Adicionar PWA Manifest

---

**Última atualização**: 2026-05-10
