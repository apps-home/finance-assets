# AGENTS.md — Finance Assets Monorepo

> Context file for AI coding assistants working on this unified monorepo.

---

## 1. Project Overview

**Finance Assets** is a personal wealth management and investment tracking platform organized as a **pnpm monorepo workspace**.

### Workspace Structure

```
finance-assets/
├── apps/
│   ├── service/           # NestJS Backend API (port 3333)
│   └── web/               # Next.js 16 App Router Frontend (port 3000)
├── packages/
│   ├── config/           # Shared Biome/TS configuration (@finance-assets-web/config)
│   ├── env/              # Environment variable schemas (@finance-assets-web/env)
│   └── lib-db/           # Prisma database layer (git submodule: @lib/db)
├── .github/
│   └── workflows/
│       ├── deploy-service.yml # CI/CD for API (GHCR build + SSH deploy to Oracle VM)
│       └── deploy-web.yml     # CI/CD for Web (GHCR build + SSH deploy to Oracle VM)
├── pnpm-workspace.yaml   # Workspace configuration and shared catalogs
├── biome.json            # Root linter/formatter config
├── script.mjs            # Version & submodule catalog mismatch checker
└── package.json
```

---

## 2. Key Technologies

| Layer | Technology |
|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, React 19) |
| **Backend Framework** | **NestJS 11** (Modular Architecture, BullMQ, Redis) |
| **Database & ORM** | **PostgreSQL** with **Prisma 7** (`packages/lib-db`) |
| **Styling** | **Tailwind CSS v4**, `tw-animate-css`, shadcn/ui |
| **State & Data Fetching**| `@tanstack/react-query`, `@tanstack/react-form`, `nuqs` |
| **Authentication** | **Better Auth** |
| **Storage** | **Cloudflare R2** |
| **Quality & Linter** | **Biome** (tabs, single quotes, no semicolons) |
| **Package Manager** | **pnpm** (workspace monorepo with catalog) |

---

## 3. Workflow & CI/CD Conventions

- Deploys run on push to `main` (with path filters) or manual trigger via `workflow_dispatch`.
- Builds are created via Docker with root context (`context: .`).
- Images are published to GitHub Container Registry (`ghcr.io`).
- Containers run on an Oracle Cloud VM attached to `public_network`.
- `docker-compose.yml` is **not** used for deployment.
