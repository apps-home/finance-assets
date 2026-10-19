# Guia de Implementação de Testes — Finance Assets Service (API)

Este documento estabelece a estratégia, a configuração e os padrões para implementação de **testes unitários** e **testes de ponta a ponta (E2E)** no `apps/service` (NestJS 11/12 com ESM e Clean Architecture), incluindo geração dinâmica de mocks com **Faker.js**.

---

## 1. Stack e Ferramental Recomendado

Para um projeto NestJS moderno configurado com ESM (`"type": "module"`) e Biome, a combinação recomendada é:

| Ferramenta | Papel | Vantagens |
|---|---|---|
| **Vitest** | Test Runner & Asserções | Suporte nativo a ESM, extremamente rápido, API compatível com Jest (`describe`, `it`, `expect`, `vi`). |
| **@nestjs/testing** | DI & Módulo de Teste | Utilitários do NestJS para simular contêiner de injeção de dependência (`Test.createTestingModule`). |
| **@faker-js/faker** | Geração Dinâmica de Dados | Criação de massas de dados realistas e dinâmicas (UUIDs, nomes de contas, moedas, datas), evitando dados hardcoded. |
| **unplugin-swc** | Compilação de Decorators | Processa decoradores TypeScript (`emitDecoratorMetadata`) com alta velocidade no Vitest. |
| **vite-tsconfig-paths** | Resolução de Path Aliases | Resolve automaticamente caminhos como `@/*` mapeados no `tsconfig.json`. |
| **supertest** | Simulação de Requisições HTTP | Executa requisições ponta a ponta sem necessidade de subir um servidor HTTP em porta de rede real. |

---

## 2. Instalação de Dependências

No diretório raiz do monorepo, execute o comando filtrado para o pacote `api` (`apps/service`):

```bash
pnpm --filter api add -D vitest @nestjs/testing @faker-js/faker unplugin-swc vite-tsconfig-paths supertest @types/supertest
```

---

## 3. Configuração do Vitest

Como os testes unitários e os testes E2E possuem ciclos de vida e escopos diferentes, recomenda-se separar suas configurações:

### 3.1. Configuração para Testes Unitários (`apps/service/vitest.config.ts`)

Crie o arquivo `apps/service/vitest.config.ts`:

```typescript
import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
})
```

### 3.2. Configuração para Testes E2E (`apps/service/vitest.config.e2e.ts`)

Crie o arquivo `apps/service/vitest.config.e2e.ts`:

```typescript
import swc from 'unplugin-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    testTimeout: 20000,
  },
  plugins: [
    tsconfigPaths(),
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
})
```

---

## 4. Scripts no `package.json`

Adicione os scripts correspondentes no `apps/service/package.json`:

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

Executando a partir da raiz do monorepo:
- `pnpm --filter api test` — Roda a suíte de testes unitários.
- `pnpm --filter api test:watch` — Roda os testes unitários em modo observador contínuo.
- `pnpm --filter api test:e2e` — Roda a suíte de testes E2E.

---

## 5. Padrão de Factories com Faker.js

Para evitar dados estáticos como `'teste'`, `'user-123'` ou valores que possam mascarar bugs de formatação, criamos **Factories** reutilizáveis utilizando o `@faker-js/faker`.

As factories ficam centralizadas na pasta `test/factories/` e permitem sobrescrever propriedades pontuais (`override`).

**Exemplo de Factory:** `test/factories/make-category.ts`

```typescript
import { faker } from '@faker-js/faker'
import { CategoryType } from '@lib/db'
import { CreateCategoryPayload } from '@/modules/assets/categories/domain/dto/create-category.dto'

export function makeCategoryPayload(
  override: Partial<CreateCategoryPayload> = {}
): CreateCategoryPayload {
  return {
    name: faker.finance.accountName(),
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(Object.values(CategoryType)),
    currency: faker.finance.currencyCode(),
    years: [
      faker.date.past().getFullYear(),
      faker.date.recent().getFullYear(),
    ],
    ...override,
  }
}
```

---

## 6. Estratégia de Testes Unitários

Nosso backend adota Clean Architecture / DDD, com casos de uso retornando instâncias funcionais de `Either<Left, Right>`.

### 6.1. Testando Use Cases com Repositórios In-Memory (Application Layer)

Em Clean Architecture / DDD, **a melhor prática para testar Use Cases é utilizar Repositórios In-Memory** em vez de mocks de funções (`vi.fn()`).

**Vantagens do padrão In-Memory:**
- **Testa comportamento real**: Valida se a entidade realmente foi armazenada, atualizada ou consultada, e não apenas se uma função espiã foi chamada.
- **Resistente a refatorações**: Mudanças na implementação interna do Use Case não quebram o teste se o comportamento esperado for mantido.
- **Alta performance**: Executa em nanossegundos em memória através de arrays JavaScript, sem necessidade de banco de dados ou contêineres Docker.

#### Exemplo de Repositório In-Memory: `test/repositories/in-memory-category.repository.ts`

```typescript
import { Category } from '@/modules/assets/categories/domain/category.entity'
import { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'
import { FindAllCategoriesParams } from '@/modules/assets/categories/domain/dto/find-all-categories-params.dto'

export class InMemoryCategoryRepository implements CategoryRepository {
  public items: Category[] = []

  async list(params: FindAllCategoriesParams): Promise<Category[]> {
    const { userId, currency, name, year, type } = params

    return this.items.filter((item) => {
      if (userId && item.userId !== userId) return false
      if (type && item.type !== type) return false
      if (currency && item.currency !== currency) return false
      if (name && !item.name.toLowerCase().includes(name.toLowerCase())) return false
      if (year && !item.years.includes(year)) return false
      return true
    })
  }

  async findById(id: string): Promise<Category | null> {
    const category = this.items.find((item) => item.id === id)
    return category ?? null
  }

  async save(category: Category): Promise<void> {
    const index = this.items.findIndex((item) => item.id === category.id)

    if (index >= 0) {
      this.items[index] = category
    } else {
      this.items.push(category)
    }
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id)
    if (index >= 0) {
      this.items.splice(index, 1)
    }
  }
}
```

#### Exemplo de Teste de Use Case: `src/modules/assets/categories/application/use-cases/create-category.spec.ts`

```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateCategoryUseCase } from './create-category'
import { InMemoryCategoryRepository } from 'test/repositories/in-memory-category.repository'
import { makeCategoryPayload } from 'test/factories/make-category'

describe('CreateCategoryUseCase', () => {
  let inMemoryCategoryRepository: InMemoryCategoryRepository
  let sut: CreateCategoryUseCase

  beforeEach(() => {
    inMemoryCategoryRepository = new InMemoryCategoryRepository()
    sut = new CreateCategoryUseCase(inMemoryCategoryRepository)
  })

  it('deve criar uma categoria com sucesso usando dados dinâmicos', async () => {
    const payload = makeCategoryPayload()

    const result = await sut.execute(payload)

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoryRepository.items).toHaveLength(1)
    expect(inMemoryCategoryRepository.items[0].name).toBe(payload.name)
    expect(inMemoryCategoryRepository.items[0].userId).toBe(payload.userId)
  })

  it('deve retornar left(PayloadError) se o nome for inválido', async () => {
    const invalidPayload = makeCategoryPayload({
      name: '', // nome inválido que aciona PayloadError
    })

    const result = await sut.execute(invalidPayload)

    expect(result.isLeft()).toBe(true)
    expect(inMemoryCategoryRepository.items).toHaveLength(0)
  })
})
```

### 6.2. Testando Controllers (Infra Layer)

Os controllers orquestram a entrada HTTP, acionam use cases e traduzem o retorno do `Either` em respostas ou exceções HTTP (`BadRequestException`, `NotFoundException`, etc.).

**Exemplo:** `src/modules/assets/categories/infra/category.controller.spec.ts`

```typescript
import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { CategoryType } from '@lib/db'
import { left, right } from '@/core/utils/Either'
import { PayloadError } from '@/core/domain/errors/payload-error'
import { CategoryController } from './category.controller'
import { CreateCategoryUseCase } from '../application/use-cases/create-category'
import { FindAllCategoriesUseCase } from '../application/use-cases/find-all-categories'
import { FindCategoryByIdUseCase } from '../application/use-cases/find-category-by-id'
import { UpdateCategoryUseCase } from '../application/use-cases/update-category'
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category'

describe('CategoryController', () => {
  let controller: CategoryController
  let createCategoryUseCaseMock: { execute: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    createCategoryUseCaseMock = {
      execute: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        { provide: CreateCategoryUseCase, useValue: createCategoryUseCaseMock },
        { provide: FindAllCategoriesUseCase, useValue: { execute: vi.fn() } },
        { provide: FindCategoryByIdUseCase, useValue: { execute: vi.fn() } },
        { provide: UpdateCategoryUseCase, useValue: { execute: vi.fn() } },
        { provide: DeleteCategoryUseCase, useValue: { execute: vi.fn() } },
      ],
    }).compile()

    controller = module.get(CategoryController)
  })

  it('deve retornar mensagem de sucesso ao criar categoria com dados dinâmicos', async () => {
    createCategoryUseCaseMock.execute.mockResolvedValue(right(undefined))

    const dto = {
      name: faker.finance.accountName(),
      type: faker.helpers.arrayElement(Object.values(CategoryType)),
      currency: faker.finance.currencyCode(),
      years: [faker.date.recent().getFullYear()],
    }
    const fakeUserId = faker.string.uuid()
    const req = { headers: { 'user-id': fakeUserId } }

    const response = await controller.create(dto, req)

    expect(response).toEqual({ message: 'Category created successfully' })
    expect(createCategoryUseCaseMock.execute).toHaveBeenCalledWith({
      ...dto,
      userId: fakeUserId,
    })
  })

  it('deve lançar BadRequestException se o use case retornar PayloadError', async () => {
    const errorMessage = faker.lorem.sentence()
    createCategoryUseCaseMock.execute.mockResolvedValue(
      left(new PayloadError(errorMessage)),
    )

    const dto = {
      name: '',
      type: CategoryType.FIXED,
      currency: 'BRL',
      years: [],
    }
    const req = { headers: { 'user-id': faker.string.uuid() } }

    await expect(controller.create(dto, req)).rejects.toThrow(BadRequestException)
  })
})
```

---

## 7. Estratégia de Testes End-to-End (E2E)

Os testes E2E validam os endpoints simulando requisições HTTP reais usando `supertest` e subindo o módulo raiz da aplicação (`AppModule`).

### 7.1. Cuidados Essenciais no Setup E2E

Para que o teste E2E reproduza com fidelidade o comportamento em produção:
1. **Configurar Pipes e Filters**: Aplicar o `ValidationPipe` e o filtro global de exceções exatamente como em `src/main.ts`.
2. **Mock ou Isolamento do Banco**:
   - Para testes rápidos sem bater no Postgres real, substitua o provider `'prismaFinanceAssets'` usando `.overrideProvider('prismaFinanceAssets')`.
   - Para testes de integração reais com banco, utilize um schema isolado de testes ou container de banco dedicado.

### 7.2. Exemplo Completo de Teste E2E com Faker.js

**Arquivo:** `test/categories.e2e-spec.ts`

```typescript
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { faker } from '@faker-js/faker'
import { AppModule } from '@/app.module'
import { CategoryType } from '@lib/db'

describe('Categories (E2E)', () => {
  let app: INestApplication
  const mockPrismaFinanceAssets = {
    assetCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('prismaFinanceAssets')
      .useValue(mockPrismaFinanceAssets)
      .compile()

    app = moduleFixture.createNestApplication()

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )

    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('POST /categories — deve criar uma categoria quando payload for válido', async () => {
    mockPrismaFinanceAssets.assetCategory.upsert.mockResolvedValue({})

    const dynamicPayload = {
      name: faker.finance.accountName(),
      type: faker.helpers.arrayElement(Object.values(CategoryType)),
      currency: faker.finance.currencyCode(),
      years: [faker.date.past().getFullYear(), faker.date.recent().getFullYear()],
    }
    const fakeUserId = faker.string.uuid()

    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('user-id', fakeUserId)
      .send(dynamicPayload)

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      message: 'Category created successfully',
    })
  })

  it('POST /categories — deve retornar 400 se faltarem campos obrigatórios no payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .set('user-id', faker.string.uuid())
      .send({
        // payload vazio desrespeita o DTO e o ValidationPipe
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toBeDefined()
  })
})
```

---

## 8. Convenções e Boas Práticas

1. **Localização dos Arquivos**:
   - **Testes Unitários**: Coloque o arquivo `.spec.ts` ao lado do arquivo sendo testado (ex: `create-category.ts` ➡️ `create-category.spec.ts`).
   - **Repositórios In-Memory**: Mantenha em `apps/service/test/repositories/` (ex: `in-memory-category.repository.ts`, `in-memory-asset.repository.ts`).
   - **Testes E2E**: Mantenha no diretório `apps/service/test/` com extensão `.e2e-spec.ts`.
   - **Factories**: Mantenha em `apps/service/test/factories/` (ex: `make-category.ts`, `make-asset.ts`).
2. **Padrão SUT (System Under Test)**:
   - Identifique a instância principal sob teste com `sut` ou o nome do componente (`controller`, `service`).
3. **In-Memory Repositories vs Mocks em Use Cases**:
   - Para testar regras de negócio da camada de aplicação, prefira sempre instanciar um repositório em memória (`InMemory*Repository`) em vez de criar mocks manuais de funções com `vi.fn()`. Isso garante asserções de estado real (`expect(repository.items).toHaveLength(1)`) e resistência a refatorações.
4. **Padrão de Factories & Faker.js**:
   - Evite strings estáticas (`'teste'`, `'user-1'`). Use `@faker-js/faker` para gerar UUIDs, nomes, e-mails, valores monetários e datas aleatórias.
   - Sempre permita `override` nas factories para customizar apenas o campo relevante para o cenário do teste.
5. **Padrão Either**:
   - Ao testar regras de negócio, valide sempre os dois caminhos:
     - Cenário Feliz: `expect(result.isRight()).toBe(true)` e inspecione `result.value`.
     - Cenário de Erro: `expect(result.isLeft()).toBe(true)` e verifique o tipo do erro (`result.value instanceof PayloadError`).
6. **Isolamento de Estado**:
   - Instancie um novo repositório in-memory no hook `beforeEach()` para garantir que nenhum teste compartilhe dados com o teste anterior.

