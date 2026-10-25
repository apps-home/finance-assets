import { faker } from '@faker-js/faker'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
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
import { PriceHistoryGateway } from '@/core/http/external/market-data/price-history.gateway'
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

describe('Asset price history (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>

  const userId = faker.string.uuid()
  const assetId = faker.string.uuid()

  const mockPrismaAuth = {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    session: { findUnique: vi.fn() }
  }

  const mockPrismaFinanceAssets = {
    asset: { findFirst: vi.fn(), findMany: vi.fn() },
    assetCategory: { findFirst: vi.fn() }
  }

  const mockPriceHistoryGateway = { fetchHistory: vi.fn() }

  function prismaCategory(type = 'VARIABLE_BR', currency = 'BRL') {
    return {
      id: faker.string.uuid(),
      userId,
      name: 'Ações',
      type,
      targetPercentage: null,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
      competences: [{ id: faker.string.uuid(), categoryId: 'x', year: 2026 }]
    }
  }

  function prismaAsset(categoryId: string) {
    return {
      id: assetId,
      categoryId,
      name: 'WEG',
      ticker: 'WEGE3',
      quantity: 10,
      averagePrice: 30,
      broker: null,
      isActive: true,
      currentClosePrice: 40,
      lastMonthClosePrice: 38,
      dividendsImportedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  function seedAsset(type = 'VARIABLE_BR', currency = 'BRL') {
    const category = prismaCategory(type, currency)

    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(
      prismaAsset(category.id)
    )
    mockPrismaFinanceAssets.assetCategory.findFirst.mockResolvedValue(category)

    return category
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('prismaAuth')
      .useValue(mockPrismaAuth)
      .overrideProvider('prismaFinanceAssets')
      .useValue(mockPrismaFinanceAssets)
      .overrideProvider(DomainJobPublisher)
      .useValue({ publish: vi.fn(), publishBulk: vi.fn() })
      // Nenhum teste pode sair para o Yahoo
      .overrideProvider(PriceHistoryGateway)
      .useValue(mockPriceHistoryGateway)
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

    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId,
      expiresAt: new Date(Date.now() + 60_000)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /assets/:id/history — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get(
      `/assets/${assetId}/history`
    )

    expect(response.status).toBe(401)
    expect(mockPriceHistoryGateway.fetchHistory).not.toHaveBeenCalled()
  })

  it('GET /assets/:id/history — should return 400 for an invalid range', async () => {
    const response = await api.get(`/assets/${assetId}/history?range=2y`)

    expect(response.status).toBe(400)
    expect(mockPriceHistoryGateway.fetchHistory).not.toHaveBeenCalled()
  })

  it('GET /assets/:id/history — should return 400 for a non-UUID id', async () => {
    const response = await api.get('/assets/not-a-uuid/history')

    expect(response.status).toBe(400)
  })

  it('GET /assets/:id/history — should return 404 for an asset not owned by the session user', async () => {
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(null)

    const response = await api.get(`/assets/${assetId}/history?range=1y`)

    expect(response.status).toBe(404)
    expect(mockPrismaFinanceAssets.asset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: assetId, category: { userId } }
      })
    )
    expect(mockPriceHistoryGateway.fetchHistory).not.toHaveBeenCalled()
  })

  it('GET /assets/:id/history — should return 404 when the provider has no data', async () => {
    seedAsset()
    mockPriceHistoryGateway.fetchHistory.mockResolvedValue(null)

    const response = await api.get(`/assets/${assetId}/history?range=1y`)

    expect(response.status).toBe(404)
  })

  it('GET /assets/:id/history — should return the series and the variation', async () => {
    seedAsset()
    mockPriceHistoryGateway.fetchHistory.mockResolvedValue([
      { date: new Date('2026-01-02T00:00:00.000Z'), close: 40 },
      { date: new Date('2026-06-01T00:00:00.000Z'), close: 50 }
    ])

    const response = await api.get(`/assets/${assetId}/history?range=ytd`)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      ticker: 'WEGE3',
      currency: 'BRL',
      range: 'ytd',
      change: 10,
      changePercent: 25
    })
    expect(response.body.points).toEqual([
      { date: '2026-01-02T00:00:00.000Z', close: 40 },
      { date: '2026-06-01T00:00:00.000Z', close: 50 }
    ])
    expect(mockPriceHistoryGateway.fetchHistory).toHaveBeenCalledWith(
      'WEGE3',
      'VARIABLE_BR',
      'ytd'
    )
  })

  it('GET /assets/:id/history — should default the range to 1m', async () => {
    seedAsset()
    mockPriceHistoryGateway.fetchHistory.mockResolvedValue([
      { date: new Date('2026-05-01T00:00:00.000Z'), close: 40 }
    ])

    const response = await api.get(`/assets/${assetId}/history`)

    expect(response.status).toBe(200)
    expect(mockPriceHistoryGateway.fetchHistory).toHaveBeenCalledWith(
      'WEGE3',
      'VARIABLE_BR',
      '1m'
    )
  })

  it.each(['CRYPTO', 'FIXED'])(
    'GET /assets/:id/history — should return 404 (not 500) for %s assets',
    async (type) => {
      seedAsset(type)
      mockPriceHistoryGateway.fetchHistory.mockResolvedValue(null)

      const response = await api.get(`/assets/${assetId}/history`)

      expect(response.status).toBe(404)
      expect(mockPriceHistoryGateway.fetchHistory).toHaveBeenCalledWith(
        'WEGE3',
        type,
        '1m'
      )
    }
  )
})
