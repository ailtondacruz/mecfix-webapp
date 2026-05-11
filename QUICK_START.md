# 🚀 MecFix - Quick Start Guide

## Acesso Rápido aos Documentos

📄 [README](./README.md) - Visão geral completa  
📄 [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) - Resumo executivo  
📄 [SETUP_STATUS](./SETUP_STATUS.md) - Status do MVP e próximos passos  
📄 [IMPLEMENTATION_COMPLETE](./IMPLEMENTATION_COMPLETE.md) - Tudo que foi criado  

### Por Projeto

**Frontend (webapp)**
- 📄 [DEVELOPMENT](./mecfix-webapp/DEVELOPMENT.md) - Guia de desenvolvimento
- 📝 [package.json](./mecfix-webapp/package.json) - Dependências

**Backend (API)**
- 📄 [DEVELOPMENT](./mecfix-api/DEVELOPMENT.md) - Guia de desenvolvimento  
- 📝 [package.json](./mecfix-api/package.json) - Dependências

---

## ⚡ Iniciar em 5 Minutos

### Terminal 1: Frontend
```bash
cd mecfix-webapp
npm run dev
```
Acesse: http://localhost:5173

### Terminal 2: Backend
```bash
cd mecfix-api
npm run start:dev
```
API rodando: http://localhost:3000

---

## 📋 Estrutura de Pastas

```
mecfix/
├── mecfix-webapp/        # React + Vite frontend
├── mecfix-api/           # NestJS backend
├── .gitignore            # Git patterns
├── README.md             # Docs principal
└── [Documentação adicional]
```

---

## 🎯 MVP Checklist

- [ ] **Auth** - Google Sign-In + JWT
- [ ] **Admin** - Dashboard + manage workshops
- [ ] **Workshops** - CRUD de oficinas
- [ ] **Customers** - CRUD de clientes
- [ ] **Budgets** - Criar orçamentos + PDF
- [ ] **Financials** - Controle simples
- [ ] **Export** - CSV/PDF mensal

---

## 🔧 Configuração Necessária

1. **Firebase Project**
   - Console: https://console.firebase.google.com
   - Enable: Firestore, Authentication (Google)
   - Get credentials

2. **Preencher .env**
   ```bash
   # mecfix-webapp/.env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_PROJECT_ID=...
   # etc
   
   # mecfix-api/.env
   FIREBASE_PROJECT_ID=...
   FIREBASE_PRIVATE_KEY=...
   # etc
   ```

---

## 💻 Principais Arquivos

### Frontend
- `src/App.tsx` - Router principal
- `src/shared/components/` - Componentes base
- `src/features/auth/pages/LoginPage.tsx` - Login
- `src/features/admin/pages/AdminDashboardPage.tsx` - Admin

### Backend
- `src/main.ts` - Entry point
- `src/app.module.ts` - Root module
- `src/common/guards/auth.guard.ts` - Auth
- `src/firebase/firebase.init.ts` - Firebase config

---

## 🌐 URLs

| Serviço | URL |
|---------|-----|
| Frontend Dev | http://localhost:5173 |
| Frontend Prod | Firebase Hosting (TBD) |
| Backend Dev | http://localhost:3000 |
| Backend Prod | Cloud Functions (TBD) |
| Firebase Console | https://console.firebase.google.com |

---

## 📞 Troubleshooting

**Erro de módulo React?**
```bash
npm install
rm -rf node_modules package-lock.json
npm install
```

**Firebase não conecta?**
- Verifique `.env` com credenciais corretas
- Cheque se ambos arquivo `.env` preenchidos

**TypeScript errors?**
- Rode `npm run lint` para ver todos
- Verifique imports relativos vs absolute

---

## 📚 Stack

```
Frontend:  React 18 + Vite + TypeScript + TailwindCSS
Backend:   NestJS + TypeScript + Firebase
Database:  Firestore (multi-tenant)
Auth:      Firebase Authentication
Deploy:    Firebase (Hosting + Functions)
```

---

## 🚀 Próximos Commits

1. Implementar `AuthService` (backend)
2. Implementar `WorkshopsService` (backend)
3. Google Sign-In (frontend)
4. Dashboard Admin (frontend + backend)

---

**Dúvidas?** Ver documentação específica de cada projeto.

🎉 **Happy coding!**
