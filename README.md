# Finance Assets — Monorepo

Repositório unificado para a plataforma **Finance Assets**, contendo a API NestJS e o Frontend Next.js 16.

---

## 📁 Estrutura do Workspace

```
finance-assets/
├── apps/
│   ├── service/           # Backend API (NestJS, Prisma, BullMQ, Redis)
│   └── web/               # Frontend (Next.js 16, React 19, Tailwind CSS v4, shadcn/ui)
├── packages/
│   ├── lib-db/            # Prisma ORM & Database Layer (Git Submodule)
│   ├── config/            # Configurações compartilhadas (@finance-assets-web/config)
│   └── env/               # Validação de variáveis de ambiente (@finance-assets-web/env)
├── .github/
│   └── workflows/
│       ├── deploy-service.yml # CI/CD da API para Oracle VM via SSH/Docker
│       └── deploy-web.yml     # CI/CD do Web para Oracle VM via SSH/Docker
├── biome.json             # Configuração central de linting e formatação
├── pnpm-workspace.yaml    # Configuração de workspaces e catálogo pnpm
├── script.mjs             # Script de auditoria de consistência de versões e catálogo
└── package.json
```

---

## 🚀 Comandos Principais

```bash
# Instalar dependências de todos os pacotes
pnpm install

# Rodar a API em desenvolvimento
pnpm dev:service

# Rodar o Web em desenvolvimento
pnpm dev:web

# Build do banco de dados (Prisma)
pnpm build:db

# Build da API
pnpm build:service

# Build do Frontend Web
pnpm build:web

# Checagem de linting e formatação (Biome)
pnpm check

# Auditoria de versões e submódulos
pnpm check-versions
```
