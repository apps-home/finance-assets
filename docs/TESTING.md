# Guia de Implementação de Testes — Services NestJS

Estratégia, configuração e padrões de **testes unitários** e **E2E** para os services NestJS (ESM, Clean Architecture / DDD, casos de uso com `Either`), com dados gerados pelo **Faker.js**.

O guia vale para qualquer service com a mesma arquitetura. Nos exemplos:

- `Item` é um recurso fictício (`src/modules/items`). Troque pelo recurso do seu módulo.
- `'prisma<Sistema>'` é o provider Prisma do domínio do sistema (ex.: `'prismaFinanceAssets'`, `'prismaMyCarTracker'`). `'prismaAuth'` é o dos models do Better Auth.
- `@lib/<sistema>-db` é o lib de banco do sistema.

---

## 1. Stack

| Ferramenta | Papel |
|---|---|
| **Vitest** | Runner e asserções, com ESM nativo e API compatível com Jest (`describe`, `it`, `expect`, `vi`). Resolve os aliases do `tsconfig.json` sozinho (`resolve.tsconfigPaths`). |
| **unplugin-swc** | Compila os decorators do NestJS com `decoratorMetadata`, que o esbuild do Vitest não emite. |
| **@nestjs/testing** | Monta o container de DI do Nest no teste (`Test.createTestingModule`). |
| **@faker-js/faker** | Gera dados realistas e variáveis (UUIDs, nomes, e-mails, valores, datas). |
| **supertest** | Faz requisições HTTP ao app sem abrir porta de rede. |

---

## 2. Instalação

Da raiz do monorepo, filtrando pelo pacote do service (aqui, `api`):

```bash
pnpm --filter api add -D vitest @nestjs/testing @faker-js/faker unplugin-swc supertest @types/supertest
```

---

## 3. Configuração do Vitest

Unitários e E2E têm escopos e tempos diferentes, então cada um tem a própria configuração.

### 3.1 Unitários (`vitest.config.ts`)

```typescript
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node'
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true
        }
      }
    })
  ]
})
```

### 3.2 E2E (`vitest.config.e2e.ts`)

Igual ao anterior, trocando o bloco `test`:

```typescript
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    testTimeout: 20000
  },
```

O E2E sobe o `AppModule`, que valida as variáveis de ambiente na inicialização: o service precisa de um `.env` com as variáveis obrigatórias (valores de teste servem, já que banco, filas e storage são substituídos).

---

## 4. Scripts no `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```

Da raiz: `pnpm --filter api test`, `pnpm --filter api test:watch` e `pnpm --filter api test:e2e`.

---

## 5. Estrutura de Pastas

```
apps/service/
├── src/modules/<modulo>/**/<arquivo>.spec.ts   # unitários, ao lado do arquivo testado
└── test/
    ├── e2e/            # <recurso>.e2e-spec.ts
    ├── factories/      # make-<entidade>.ts
    ├── repositories/   # in-memory-<entidade>.repository.ts
    ├── events/         # fake-event-publisher.ts
    ├── notifications/  # fake-notifier.ts
    └── storage/        # fake-storage.ts
```

Os fakes de infraestrutura implementam as mesmas interfaces de `src/core/domain` (`DomainEventPublisher`, `DomainNotifier`, `DomainStorage`) e guardam o que receberam para as asserções (ex.: `fakeStorage.files`).

---

## 6. Factories com Faker.js

Dados fixos (`'teste'`, `'user-1'`) escondem bugs de formatação e deixam todos os testes iguais. As factories geram dados variáveis e aceitam `override` para fixar só o campo que importa no cenário.

**`test/factories/make-item.ts`**

```typescript
import { faker } from '@faker-js/faker'

import type { CreateItemPayload } from '@/modules/items/domain/dto/create-item.dto'
import { Item, type ItemProps } from '@/modules/items/domain/item.entity'

export function makeItemPayload(
  override: Partial<CreateItemPayload> = {}
): CreateItemPayload {
  return {
    userId: faker.string.uuid(),
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent(),
    ...override
  }
}

export function makeItem(override: Partial<ItemProps> = {}): Item {
  return new Item({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
```

---

## 7. Testes Unitários

### 7.1 Use Cases com Repositórios In-Memory

Teste casos de uso com **repositórios in-memory**, não com `vi.fn()`:

- **Comportamento real:** a asserção é sobre o que ficou guardado (`expect(repository.items).toHaveLength(1)`), não sobre qual função foi chamada.
- **Resistente a refatorações:** mudar a implementação interna do use case não quebra o teste se o resultado for o mesmo.
- **Rápido:** arrays em memória, sem banco nem container.

O repositório in-memory implementa o contrato abstrato do domínio e **reproduz o escopo por usuário**: `findById(id, userId)` só devolve o item do dono.

**`test/repositories/in-memory-item.repository.ts`**

```typescript
import type { ListItemsParams } from '@/modules/items/domain/dto/list-items-params.dto'
import type { Item } from '@/modules/items/domain/item.entity'
import type { ItemRepository } from '@/modules/items/domain/item.repository'

export class InMemoryItemRepository implements ItemRepository {
  public items: Item[] = []

  async list({ userId, search }: ListItemsParams): Promise<Item[]> {
    return this.items.filter((item) => {
      if (item.userId !== userId) return false
      if (search && !item.name.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }

  async findById(id: string, userId: string): Promise<Item | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    )
  }

  async save(item: Item): Promise<void> {
    const index = this.items.findIndex(({ id }) => id === item.id)

    if (index >= 0) {
      this.items[index] = item
    } else {
      this.items.push(item)
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
```

**`src/modules/items/application/use-cases/create-item.spec.ts`**

```typescript
import { makeItemPayload } from '@test/factories/make-item'
import { InMemoryItemRepository } from '@test/repositories/in-memory-item.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'

import { CreateItemUseCase } from './create-item'

describe('CreateItemUseCase', () => {
  let itemRepository: InMemoryItemRepository
  let sut: CreateItemUseCase

  beforeEach(() => {
    itemRepository = new InMemoryItemRepository()
    sut = new CreateItemUseCase(itemRepository)
  })

  it('should create an item', async () => {
    const payload = makeItemPayload()

    const result = await sut.execute(payload.userId, payload)

    expect(result.isRight()).toBe(true)
    expect(itemRepository.items).toHaveLength(1)
    expect(itemRepository.items[0].name).toBe(payload.name)
  })

  it('should return PayloadError when the name is empty', async () => {
    const payload = makeItemPayload({ name: '' })

    const result = await sut.execute(payload.userId, payload)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PayloadError)
    expect(itemRepository.items).toHaveLength(0)
  })
})
```

### 7.2 Escopo por Usuário (Ownership)

Todo caso de uso que lê ou altera um recurso por `id` tem um spec de ownership: o dono recebe sucesso e **outro usuário recebe `...NotFoundError`**, sem nada mudar. É esse teste que garante que um usuário nunca alcança o dado de outro.

```typescript
it('should not delete an item that belongs to another user', async () => {
  const item = makeItem()
  itemRepository.items.push(item)

  const result = await sut.execute(faker.string.uuid(), item.id)

  expect(result.value).toBeInstanceOf(ItemNotFoundError)
  expect(itemRepository.items).toHaveLength(1)
})
```

### 7.3 Entidades (`update()` parcial)

Cada entidade com `update()` tem um spec ao lado (`<nome>.entity.spec.ts`) cobrindo:

- campos `undefined` não sobrescrevem o valor atual;
- `null` limpa campos anuláveis;
- normalizações (trim, maiúsculas);
- identidade preservada (`id`, dono e chaves não editáveis);
- valores inválidos rejeitados com `PayloadError`.

Regras de cálculo puras (em `domain/`, sem dependências) também ganham spec próprio, com casos de borda explícitos.

### 7.4 Controllers

O controller só traduz o `Either` em resposta ou exceção HTTP. Use mocks dos use cases (aqui `vi.fn()` é o certo: o que se testa é o contrato HTTP, não a regra de negócio).

**`src/modules/items/infra/item.controller.spec.ts`**

```typescript
import { faker } from '@faker-js/faker'
import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { left, right } from '@/core/utils/Either'

import { CreateItemUseCase } from '../application/use-cases/create-item'
import { ItemController } from './item.controller'

describe('ItemController', () => {
  let controller: ItemController
  const createItem = { execute: vi.fn() }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      controllers: [ItemController],
      // Um provider por use case injetado no controller
      providers: [{ provide: CreateItemUseCase, useValue: createItem }]
    }).compile()

    controller = module.get(ItemController)
  })

  it('should answer with a message when the item is created', async () => {
    createItem.execute.mockResolvedValue(right(undefined))
    const userId = faker.string.uuid()
    const dto = { name: faker.commerce.productName(), amount: 10 }

    // O userId chega pelo @CurrentUserId(), já resolvido a partir da sessão
    const response = await controller.create(dto, userId)

    expect(response).toEqual({ message: 'Item created successfully' })
    expect(createItem.execute).toHaveBeenCalledWith(userId, dto)
  })

  it('should throw BadRequestException on PayloadError', async () => {
    createItem.execute.mockResolvedValue(left(new PayloadError('Invalid')))

    await expect(
      controller.create({ name: '', amount: 10 }, faker.string.uuid())
    ).rejects.toThrow(BadRequestException)
  })
})
```

---

## 8. Testes E2E

O E2E sobe o `AppModule` inteiro e faz requisições com `supertest`, validando rota, guard, `ValidationPipe`, controller, use case e mapeamento de erros juntos.

### 8.1 Cuidados no Setup

1. **Pipes e filtros iguais ao `main.ts`:** aplique o mesmo `ValidationPipe` e o `AllExceptionsFilter`. Sem o filtro, erros de domínio e inesperados não saem com o status de produção.
2. **Sessão:** o `SessionAuthGuard` do `@lib/auth/nest` é global. Toda requisição envia `Authorization: Bearer <token>`, e o `'prismaAuth'` é mockado com `session.findUnique` devolvendo `{ userId, expiresAt }` (futuro para sessão válida, passado para expirada). O `userId` da sessão é o que chega ao controller.
3. **Banco:** para não bater no Postgres, substitua o `'prisma<Sistema>'` com `.overrideProvider` e mocke só os métodos que a rota usa. Para integração real, use um banco ou schema exclusivo de teste.
4. **Infraestrutura externa:** substitua `DomainJobPublisher` (Redis/BullMQ), `DomainStorage` (R2) e `DomainNotifier` pelos fakes de `test/`.

### 8.2 Exemplo

**`test/e2e/items.e2e-spec.ts`**

```typescript
import { faker } from '@faker-js/faker'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { AppModule } from '@/app.module'
import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

describe('Items (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>
  let userId: string

  const mockPrismaAuth = {
    session: { findUnique: vi.fn() }
  }

  const mockPrismaDomain = {
    item: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn()
    }
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('prismaAuth')
      .useValue(mockPrismaAuth)
      .overrideProvider('prisma<Sistema>')
      .useValue(mockPrismaDomain)
      .overrideProvider(DomainJobPublisher)
      .useValue({ publish: vi.fn(), publishBulk: vi.fn() })
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    )
    app.useGlobalFilters(new AllExceptionsFilter())
    await app.init()

    api = request.agent(app.getHttpServer())
    api.set('Authorization', 'Bearer valid-session-token')
  })

  beforeEach(() => {
    vi.clearAllMocks()
    userId = faker.string.uuid()

    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId,
      expiresAt: new Date(Date.now() + 60_000)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /items — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/items')

    expect(response.status).toBe(401)
  })

  it('POST /items — should create an item', async () => {
    mockPrismaDomain.item.upsert.mockResolvedValue({})

    const response = await api.post('/items').send({
      name: faker.commerce.productName(),
      amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 })
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ message: 'Item created successfully' })
  })

  it('POST /items — should return 400 for an invalid payload', async () => {
    const response = await api.post('/items').send({})

    expect(response.status).toBe(400)
  })

  it("GET /items/:id — should return 404 for another user's item", async () => {
    // O repositório filtra por userId: o item de outro usuário não é encontrado
    mockPrismaDomain.item.findFirst.mockResolvedValue(null)

    const response = await api.get(`/items/${faker.string.uuid()}`)

    expect(response.status).toBe(404)
  })
})
```

---

## 9. Convenções

1. **SUT:** a instância sob teste se chama `sut` (ou `controller` nos specs de controller).
2. **In-memory nos use cases, mocks nos controllers e no E2E:** a regra de negócio é testada com estado real; o contrato HTTP, com o use case ou o Prisma mockados.
3. **Estado isolado:** repositórios e fakes novos no `beforeEach()`; `vi.clearAllMocks()` quando houver mocks compartilhados.
4. **Faker com `override`:** nada de strings fixas; fixe só o campo que o cenário precisa.
5. **Os dois lados do `Either`:** `isRight()` com o `result.value` esperado, e `isLeft()` com o tipo do erro (`toBeInstanceOf(PayloadError)`).
6. **Ownership sempre:** recurso de outro usuário responde `...NotFoundError` (404), nunca 403, e nada é alterado.
7. **Nomes dos testes:** descrevem o comportamento (`should ...`); no E2E, prefixe com o método e a rota (`POST /items — should ...`).
