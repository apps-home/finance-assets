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
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

describe('Dividends (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>

  const userId = faker.string.uuid()

  const mockPrismaAuth = {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    session: { findUnique: vi.fn() }
  }

  const mockPrismaFinanceAssets = {
    asset: { findFirst: vi.fn(), findMany: vi.fn() },
    assetCategory: { findFirst: vi.fn() },
    assetDividend: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn()
    }
  }

  function prismaAsset(categoryId: string) {
    return {
      id: faker.string.uuid(),
      categoryId,
      name: 'Maxi Renda',
      ticker: 'MXRF11',
      quantity: 100,
      averagePrice: 10,
      broker: null,
      isActive: true,
      currentClosePrice: 10,
      lastMonthClosePrice: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  function prismaCategory(currency = 'BRL') {
    return {
      id: faker.string.uuid(),
      userId,
      name: 'FIIs',
      type: 'FII',
      targetPercentage: null,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
      competences: [{ id: faker.string.uuid(), categoryId: 'x', year: 2026 }]
    }
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

  it('GET /dividends — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/dividends')

    expect(response.status).toBe(401)
  })

  it('GET /dividends — should scope the query to the session user', async () => {
    mockPrismaFinanceAssets.assetDividend.findMany.mockResolvedValue([])

    const response = await api.get('/dividends?year=2026')

    expect(response.status).toBe(200)
    expect(mockPrismaFinanceAssets.assetDividend.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          paymentDate: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-12-31T00:00:00.000Z')
          }
        })
      })
    )
  })

  it('GET /dividends/summary — should not be captured by the :id route', async () => {
    mockPrismaFinanceAssets.assetDividend.findMany.mockResolvedValue([])

    const response = await api.get('/dividends/summary?year=2026')

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      year: 2026,
      totalYear: 0,
      monthlyAverage: 0
    })
    expect(response.body.byMonth).toHaveLength(12)
    expect(response.body.last12Months).toHaveLength(12)
  })

  it('GET /dividends/summary — should reject an invalid year', async () => {
    const response = await api.get('/dividends/summary?year=abc')

    expect(response.status).toBe(400)
  })

  it('GET /dividends/upcoming — should list future payments', async () => {
    mockPrismaFinanceAssets.assetDividend.findMany.mockResolvedValue([])

    const response = await api.get('/dividends/upcoming')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('POST /dividends/backfill — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).post(
      '/dividends/backfill'
    )

    expect(response.status).toBe(401)
  })

  it('POST /dividends/backfill — should reject an out-of-range window', async () => {
    const response = await api.post('/dividends/backfill').send({ months: 99 })

    expect(response.status).toBe(400)
  })

  it('POST /dividends/backfill — should scope the assets to the session user', async () => {
    mockPrismaFinanceAssets.asset.findMany.mockResolvedValue([])

    const response = await api.post('/dividends/backfill').send({})

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ enqueued: 0 })
    expect(mockPrismaFinanceAssets.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: expect.objectContaining({ userId }),
          isActive: true
        })
      })
    )
  })

  it('GET /dividends/:id — should return 400 for an invalid uuid', async () => {
    const response = await api.get('/dividends/not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('GET /dividends/:id — should return 404 for a dividend of another user', async () => {
    mockPrismaFinanceAssets.assetDividend.findFirst.mockResolvedValue(null)
    const id = faker.string.uuid()

    const response = await api.get(`/dividends/${id}`)

    expect(response.status).toBe(404)
    expect(
      mockPrismaFinanceAssets.assetDividend.findFirst
    ).toHaveBeenCalledWith({ where: { id, userId } })
  })

  it('POST /dividends — should reject a body without payment date', async () => {
    const response = await api.post('/dividends').send({
      assetId: faker.string.uuid(),
      amount: 10
    })

    expect(response.status).toBe(400)
  })

  it('POST /dividends — should return 404 when the asset is not found', async () => {
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(null)

    const response = await api.post('/dividends').send({
      assetId: faker.string.uuid(),
      amount: 10,
      paymentDate: '2026-03-10'
    })

    expect(response.status).toBe(404)
  })

  it('POST /dividends — should return 400 for a foreign asset without exchange rate', async () => {
    const category = prismaCategory('USD')
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(
      prismaAsset(category.id)
    )
    mockPrismaFinanceAssets.assetCategory.findFirst.mockResolvedValue(category)

    const response = await api.post('/dividends').send({
      assetId: faker.string.uuid(),
      amount: 10,
      paymentDate: '2026-03-10'
    })

    expect(response.status).toBe(400)
  })

  it('POST /dividends — should create a dividend computed from the rate', async () => {
    const category = prismaCategory()
    const asset = prismaAsset(category.id)
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(asset)
    mockPrismaFinanceAssets.assetCategory.findFirst.mockResolvedValue(category)
    mockPrismaFinanceAssets.assetDividend.findUnique.mockResolvedValue(null)
    mockPrismaFinanceAssets.assetDividend.upsert.mockResolvedValue(undefined)

    const response = await api.post('/dividends').send({
      assetId: asset.id,
      type: 'INCOME',
      rateAmount: 0.1,
      paymentDate: '2026-03-10'
    })

    expect(response.status).toBe(201)
    expect(mockPrismaFinanceAssets.assetDividend.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId,
          assetId: asset.id,
          type: 'INCOME',
          source: 'MANUAL',
          amount: 10,
          quantity: 100,
          paymentDate: new Date('2026-03-10T00:00:00.000Z')
        })
      })
    )
  })
})
