# AGENTS.md — Finance Assets Web

> Context file for AI coding assistants working on this project.

---

## Project Overview

**Finance Assets Web** is a personal finance management application built as a **pnpm monorepo workspace**.

### Workspace Structure

```
finance-assets/
├── apps/
│   ├── service/          # NestJS backend API (runs on port 3333)
│   └── web/              # Next.js 16 frontend (runs on port 3000)
├── packages/
│   ├── config/           # Shared Biome/TS config (@finance-assets-web/config)
│   ├── env/              # Environment variable schemas (@finance-assets-web/env)
│   └── lib-db/           # Prisma database layer (git submodule: @lib/db)
├── pnpm-workspace.yaml   # Workspace configuration and shared catalogs
├── biome.json            # Root linter/formatter config
├── scripts/check-version.mjs # Version & submodule catalog mismatch checker
└── package.json
```

### Key Technologies

| Layer          | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Framework      | **Next.js 16** (App Router)                               |
| Language       | **TypeScript 5.9+**                                       |
| Package Mgr    | **pnpm** (workspace monorepo)                             |
| Styling        | **Tailwind CSS v4** + `tw-animate-css`                    |
| UI Library     | **shadcn/ui** (Base UI / Radix primitives)                |
| Variants       | `class-variance-authority` (cva)                          |
| Class Merging  | `clsx` + `tailwind-merge` → `cn()` utility               |
| Icons          | `lucide-react`                                            |
| State Mgmt     | `@tanstack/react-query` (server state)                    |
| Forms          | `@tanstack/react-form`                                    |
| URL State      | `nuqs`                                                    |
| Auth           | `better-auth`                                             |
| HTTP Client    | `axios`                                                   |
| Charts         | `recharts`                                                |
| Toasts         | `sonner`                                                  |
| Theme          | `next-themes` (light/dark)                                |
| Linter/Format  | **Biome** (tabs, single quotes, no semicolons)            |
| ORM            | **Prisma 7**                                              |

---

## Installing shadcn Components

This is a **pnpm workspace** project. To add a new shadcn component, you **MUST** run:

```bash
pnpm dlx shadcn@latest add <component_name>
```

Run this command from the `apps/web` directory. **Never** use `npx` — always use `pnpm dlx`.

---

## Frontend Architecture (`apps/web/src/`)

```
src/
├── app/              # Next.js App Router pages and layouts
├── features/         # Feature modules (assets, categories, dashboard, profile, wishlist)
├── infrastructure/   # Infrastructure layer
│   ├── api/          # API client configuration
│   └── services/     # External services integration
├── shared/           # Shared modules
│   ├── components/   # Shared React components (ui, Header, etc.)
│   ├── config/       # App configuration (menus, constants)
│   ├── hooks/        # Shared React and custom hooks (use-media-query, use-local-storage, etc.)
│   ├── lib/          # Core utilities (auth, cn(), current-user)
│   ├── providers/    # React context providers
│   ├── store/        # Zustand global stores (auth, theme, etc.)
│   └── utils/        # General-purpose utilities
├── index.css         # Design system tokens & Tailwind config
└── proxy.ts          # API proxy config
```

### Feature Module Structure

Feature modules live under `src/features/<feature>/` and follow this pattern:

```
features/<feature>/
├── api/              # API calls and request/response types (e.g. index.ts, types.ts)
├── components/       # Feature-specific React components
├── hooks/            # Custom React hooks (TanStack Query hooks, e.g. use<Feature>)
├── types/            # TypeScript domain & UI types
└── utils/            # Feature-specific helper functions (optional)
```

---

## State Management (Zustand)

Global stores live under `src/shared/store/`. Each store is a single file created with `create()` from `zustand`.

```
src/shared/store/
├── auth-store.ts        # Auth state (user, session, tokens)
├── theme-store.ts       # Theme state (mode, toggle)
└── ...
```

- Feature-specific stores (if needed) belong in `features/<feature>/store/`.
- Stores should be co-located with the components that consume them.
- Use `@tanstack/react-query` for server state (data fetching, mutations). Use Zustand only for **client-side** UI/authentication state.
- Do **not** store server-fetched data in Zustand — that belongs in React Query cache.

---

## Design System Tokens

Defined in `src/index.css`. All colors use **oklch** format. The system supports **light** and **dark** themes.

### Color Tokens (CSS Custom Properties)

| Token                          | Purpose                              |
| ------------------------------ | ------------------------------------ |
| `--background` / `--foreground`| Page background and primary text     |
| `--card` / `--card-foreground` | Card surfaces                        |
| `--popover` / `--popover-foreground` | Popover/dropdown surfaces      |
| `--primary` / `--primary-foreground` | Primary action color (dark: green `oklch(0.65 0.22 145)`) |
| `--secondary` / `--secondary-foreground` | Secondary surfaces           |
| `--muted` / `--muted-foreground`     | Muted/disabled states          |
| `--accent` / `--accent-foreground`   | Accent highlights              |
| `--destructive`                | Destructive/error actions            |
| `--border`                     | Border color                         |
| `--input`                      | Form input borders                   |
| `--ring`                       | Focus ring color (dark: green)       |
| `--sidebar-*`                  | Sidebar-specific tokens              |
| `--chart-1` through `--chart-6`| Chart color palette (emerald, blue, violet, amber, pink, cyan) |

### Radius Scale

Base radius: `--radius: 0.625rem`. All others derive from it:
- `--radius-sm`: `calc(var(--radius) - 4px)`
- `--radius-md`: `calc(var(--radius) - 2px)`
- `--radius-lg`: `var(--radius)` (base)
- `--radius-xl` through `--radius-4xl`: progressively larger

### Typography

- Font: `--font-sans: var(--font-inter), sans-serif` (Inter)
- Base body text: `text-xs` (~12px) with `text-xs/relaxed` line height
- Titles/headings: `text-sm` (~14px)

### Dark Mode

Activated via `.dark` class on `<html>`. The dark theme uses:
- Near-black backgrounds (`oklch(0.05 0 0)`)
- Green primary (`oklch(0.65 0.22 145)`)
- Lighter card surface (`oklch(0.16 0 0)`)
- Subtle borders (`oklch(0.2 0 0)`)

---

## Component Conventions

### shadcn UI Components (`src/shared/components/ui/`)

These are **generated by shadcn** and follow its patterns. **Do not manually create files here** — always use `pnpm dlx shadcn@latest add <name>`.

#### Pattern Summary

1. **Function components** (not arrow functions, not `React.FC`)
2. **`data-slot` attribute** on every component root for identification
3. **`cn()` utility** for merging `className` (import from `@/shared/lib/utils`)
4. **Primitives from `@base-ui/react`** (Button, Input, Dialog, Select, Tabs)
5. **`@radix-ui/react-slot`** for `asChild` polymorphism
6. **`cva`** from `class-variance-authority` for variant definitions
7. **Named exports** only (no default exports in `ui/` files)
8. **No `React.forwardRef`** — use the latest React 19 ref-forwarding pattern
9. **Tailwind classes** use design system tokens (e.g. `bg-primary`, `text-muted-foreground`)

#### Available Components

| Component         | File                   | Primitives Used     |
| ----------------- | ---------------------- | ------------------- |
| Alert             | `alert.tsx`            | native              |
| AlertDialog       | `alert-dialog.tsx`     | `@base-ui/react`    |
| Avatar            | `avatar.tsx`           | native              |
| Badge             | `badge.tsx`            | `@base-ui/react`    |
| Button            | `button.tsx`           | `@base-ui/react`    |
| Card              | `card.tsx`             | native              |
| Checkbox          | `checkbox.tsx`         | `@base-ui/react`    |
| Dialog            | `dialog.tsx`           | `@base-ui/react`    |
| DropdownMenu      | `dropdown-menu.tsx`    | `@base-ui/react`    |
| Input             | `input.tsx`            | `@base-ui/react`    |
| Label             | `label.tsx`            | native              |
| NavigationMenu    | `navigation-menu.tsx`  | `@base-ui/react`    |
| Select            | `select.tsx`           | `@base-ui/react`    |
| Separator         | `separator.tsx`        | native              |
| Skeleton          | `skeleton.tsx`         | native              |
| Sonner (toasts)   | `sonner.tsx`           | `sonner`            |
| Table             | `table.tsx`            | native              |
| Tabs              | `tabs.tsx`             | `@base-ui/react`    |

### Custom Components (`src/shared/components/<Name>/`)

When creating a **custom** (non-shadcn) component, follow this pattern:

```
src/shared/components/<ComponentName>/
└── index.tsx        # Single file with default or named export
```

#### Rules for Custom Components

1. **Folder per component** with an `index.tsx` entry point
2. **Use `'use client'`** directive if the component uses React hooks, browser APIs, or event handlers
3. **Compose with `ui/` primitives** — import `Button`, `Card`, `DropdownMenu`, etc. from `@/shared/components/ui/`
4. **Use design tokens** — use Tailwind classes that reference CSS custom properties (`bg-card`, `text-primary`, `border-border`, etc.)
5. **Use `lucide-react`** for icons
6. **Import aliases**: use `@/` path alias (maps to `src/`)
7. **Follow the same function component style** as shadcn components
8. **Use `cn()`** for conditional/merged classNames

#### Example Custom Component Template

```tsx
'use client'

import { SomeIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

interface MyComponentProps {
  className?: string
  title: string
}

export function MyComponent({ className, title }: MyComponentProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SomeIcon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{title}</span>
      <Button variant="outline" size="sm">
        Action
      </Button>
    </div>
  )
}
```

---

## Code Style & Formatting (Biome)

The project uses **Biome** for linting and formatting. Key rules:

| Rule               | Value                          |
| ------------------- | ------------------------------ |
| Indent style        | **Tabs**                       |
| Quotes              | **Single quotes** (`'`)        |
| JSX quotes          | **Double quotes** (`"`)        |
| Semicolons          | **As needed** (omit when possible) |
| Trailing commas     | **None**                       |
| Unused imports      | **Warn** (auto-fix)            |
| Class sorting       | **Warn** (tailwind class order via `useSortedClasses` for `clsx`, `cva`, `cn`) |
| Self-closing tags   | **Required** (`<div />`)       |

### Import Order (enforced by Biome)

Biome enforces a specific import order with blank-line separation:

```tsx
// 1. Node/Bun built-ins
// 2. npm packages (react, next, lucide-react, etc.)

// 3. Workspace packages (@finance-assets-web/*)

// 4. Absolute aliases (@/shared/components/*, @/features/*, etc.)

// 5. Relative imports (./*, ../*) 
```

---

## Common Patterns

### URL State with nuqs

```tsx
import { useQueryState } from 'nuqs'

const [selectedYear, setSelectedYear] = useQueryState('year')
```

### Dynamic Rendering / Offscreen Components (React 19)

Use React's `<Activity>` to keep components mounted but paused (preserving DOM, scroll, state, and stopping effects/queries) when they are visually hidden (like inactive tabs or multi-step forms).

```tsx
import { Activity } from 'react'

// Example in Tabs (requires `keepMounted` on the container so it doesn't unmount the Activity)
<TabsContent value="profile" keepMounted>
  <Activity mode={activeTab === 'profile' ? 'visible' : 'hidden'}>
    <HeavyComponent />
  </Activity>
</TabsContent>
```

### Toasts

```tsx
import { toast } from 'sonner'

toast.success('Operation completed')
toast.error('Something went wrong')
```

### API & Hooks Architecture (Server vs Client Separation)

A arquitetura de features do frontend separa estritamente **camada HTTP / Server-Side** de **gerenciamento de cache / Client-Side**:

1. **`features/<feature>/api/` (Server-Side / HTTP Layer)**:
   - Funções assíncronas puras (`index.ts`) que disparam requisições HTTP via `axios` e os tipos/DTOs de payload e resposta (`types.ts`).
   - **Propósito**: Pode ser consumida diretamente no **Server-Side** (Server Components do App Router, Route Handlers) ou fornecida como `queryFn`/`mutationFn` para os hooks de cliente.
   - Não contém hooks do React nem acoplamento com TanStack Query.

2. **`features/<feature>/hooks/` (Client-Side / TanStack Query Layer)**:
   - Exclusivo para componentes cliente (`'use client'`).
   - Aproveita os caches globais, refetching e deduplicação do `@tanstack/react-query`.
   - Exporta as constantes de Query Key (`export const <FEATURE>_QUERY_KEY = '...'`).
   - Expõe queries com `placeholderData: (prev) => prev`.
   - Expõe mutations granulares (`useCreate...`, `useUpdate...`, `useDelete...`) que já encapsulam `onSuccess` (com `toast.success` e `queryClient.invalidateQueries`) e `onError` (com `toast.error`).
   - **Regra**: Componentes cliente devem consumir esses hooks customizados em vez de criar `useMutation` ad-hoc nas telas.

#### Padrão Oficial de Feature Hooks (Referência: `features/categories/hooks/use-category.ts`)

```tsx
// features/<feature>/hooks/use-<feature>.ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { queryClient } from '@/shared/providers/query-client'
import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem
} from '../api'
import type {
  CreateItemDTO,
  ListItemsParams,
  UpdateItemDTO
} from '../api/types'

export const ITEM_QUERY_KEY = 'items'

// 1. Queries
export function useItems(params?: ListItemsParams) {
  return useQuery({
    queryKey: [ITEM_QUERY_KEY, params],
    queryFn: () => listItems(params),
    placeholderData: (prev) => prev
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: [ITEM_QUERY_KEY, id],
    queryFn: () => getItemById(id)
  })
}

// 2. Mutations granulares (com toast e invalidação automática de cache)
export function useCreateItem() {
  return useMutation({
    mutationFn: (dto: CreateItemDTO) => createItem(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEM_QUERY_KEY] })
      toast.success('Item criado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao criar item'
      toast.error(message)
    }
  })
}

export function useUpdateItem() {
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateItemDTO }) =>
      updateItem(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEM_QUERY_KEY] })
      toast.success('Item atualizado com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar item'
      toast.error(message)
    }
  })
}

export function useDeleteItem() {
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEM_QUERY_KEY] })
      toast.success('Item excluído com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao excluir item'
      toast.error(message)
    }
  })
}
```

> [!IMPORTANT]
> **Consumo em Componentes Cliente**:
> Os hooks de query retornam a instância de `useQuery`. Sempre desestruture a propriedade `data`:
> ```tsx
> const { data: items = [], isLoading } = useItems()
> const { mutate: createItem, isPending } = useCreateItem()
> ```

---

## Creating a New Feature

Ao criar uma nova feature, siga esta ordem de implementação:

### 1. Criar a estrutura de diretórios

```
features/<feature>/
├── api/              # Camada HTTP pura (index.ts) e DTOs (types.ts) — Server-Side & QueryFn

├── store/            # Zustand store (only if needed)
├── components/       # Componentes React da feature (Dialogs, Cards, Tables)
├── hooks/            # Custom hooks TanStack Query (use-<feature>.ts) — Client-Side
├── types/            # Tipos e interfaces de domínio e UI
└── utils/            # Utilitários e cálculos específicos da feature (opcional)
```

### 2. Implementar a camada HTTP (`features/<feature>/api/`)

Crie funções assíncronas puras em `api/index.ts` usando a instância base do axios de `@/infrastructure/api/`. Defina os DTOs em `api/types.ts`.

### 3. Criar os Custom Hooks (`features/<feature>/hooks/use-<feature>.ts`)

Implemente os hooks conforme o padrão oficial acima, exportando as constantes de query key, queries com `placeholderData`, e mutations com tratamento automático de toasts e `queryClient.invalidateQueries`.

### 4. Construir os Componentes de UI (`features/<feature>/components/`)

Consuma os custom hooks nos componentes cliente. Utilize os componentes primitivos de `@/shared/components/ui/` (shadcn) e componha layouts com `cn()` e design tokens.

### 5. Configurar Rotas em `app/`

Crie a rota sob `app/(application)/<feature>/page.tsx`. Se a página for um Server Component, ela pode pré-carregar dados via `api/` ou delegar o ciclo de vida dinâmico para um `<Feature>Client.tsx` que consome os hooks de `hooks/`.

---

## Dependency Version & Submodule Verification

The workspace includes a version checker (`scripts/check-version.mjs`) that verifies dependency consistency across:
- Root `package.json` and all apps (`apps/*`)
- Workspace packages and Git submodules (`packages/*`, `.gitmodules`)
- Shared catalog definitions in `pnpm-workspace.yaml` (`catalog:`)

It flags:
- **Version Mismatches**: When packages/submodules use different versions of the same library (e.g. `typescript`, `@types/node`).
- **Catalog Inconsistencies**: When a dependency defined in `catalog:` is hardcoded or differs in a package/submodule.
- **Submodule Discrepancies**: Highlights differences specifically originating from Git submodules like `packages/lib-db`.

Run verification at any time:

```bash
pnpm check-versions
```

---

## Do's and Don'ts

### ✅ Do

- Use `pnpm dlx shadcn@latest add <name>` to install shadcn components
- Use `Tooltip`, `TooltipTrigger`, and `TooltipContent` from `@/shared/components/ui/tooltip` for icon buttons, action hints, and truncated texts instead of native HTML `title`
- Use `cn()` from `@/shared/lib/utils` for all dynamic classNames
- Use design tokens (`bg-primary`, `text-muted-foreground`, etc.) — never hardcode colors
- Use `lucide-react` for icons
- Use function declarations (not arrow functions) for components
- Add `data-slot` attributes to custom component roots
- Use `'use client'` only when the component needs client-side features
- Use `shared/hooks/` for reusable hooks and `features/<feature>/hooks/` for feature-specific hooks
- Import with `@/` alias, never with relative paths to other top-level directories
- Keep text sizing consistent: `text-xs` for body, `text-sm` for titles/headings
- Run `pnpm check-versions` to ensure dependency alignment with submodules and `catalog:`
- Format with Biome before committing (tabs, single quotes, no trailing commas)

### ❌ Don't

- Don't use native HTML `title` attribute for tooltips or action hints — always use shadcn `Tooltip` from `@/shared/components/ui/tooltip`
- Don't manually create files in `src/components/ui/` — use shadcn CLI
- Don't use `npx` — use `pnpm dlx`
- Don't use `React.FC` or `React.forwardRef` — use modern function components
- Don't hardcode hex/rgb colors — use oklch tokens from the design system
- Don't use semicolons unless syntactically required
- Don't use arrow functions for component definitions (use `function` declarations)
- Don't use `React.useState` fully qualified — just import `{ useState }` from react
- Don't install dependencies with `npm` — always use `pnpm add` (with `-w` for root, or scoped to workspace)

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Run the web app (dev mode, port 3000)
pnpm --filter web dev

# Build for production
pnpm --filter web build

# Check dependency versions & catalog alignment across workspace/submodules
pnpm check-versions

# Lint & format
pnpm biome check --write .
```
