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

describe('Price alerts and notifications (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>

  const userId = faker.string.uuid()

  const mockPrismaAuth = {
    session: { findUnique: vi.fn() }
  }

  const mockPrismaFinanceAssets = {
    asset: { findFirst: vi.fn() },
    priceAlert: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }
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
      .useValue({ publish: vi.fn() })
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

  it('GET /notifications/inbox-session — should describe the inbox of the session user', async () => {
    const response = await api.get('/notifications/inbox-session')

    expect(response.status).toBe(200)

    // Depende das variáveis NOVU_* do .env local
    if (response.body.enabled) {
      expect(response.body.subscriberId).toBe(userId)
      expect(response.body.subscriberHash).toEqual(expect.any(String))
    } else {
      expect(response.body).toEqual({ enabled: false })
    }
  })

  it('GET /price-alerts — should list only the alerts of the session user', async () => {
    mockPrismaFinanceAssets.priceAlert.findMany.mockResolvedValue([])

    const response = await api.get('/price-alerts')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
    expect(mockPrismaFinanceAssets.priceAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId }) })
    )
  })

  it('POST /price-alerts — should reject an invalid target price', async () => {
    const response = await api
      .post('/price-alerts')
      .send({ assetId: faker.string.uuid(), targetPrice: -1 })

    expect(response.status).toBe(400)
  })

  it('POST /price-alerts — should require exactly one source', async () => {
    const response = await api.post('/price-alerts').send({ targetPrice: 40 })

    expect(response.status).toBe(400)
    expect(mockPrismaFinanceAssets.priceAlert.create).not.toHaveBeenCalled()
  })

  it('POST /price-alerts — should return 404 for an asset of another user', async () => {
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(null)

    const response = await api
      .post('/price-alerts')
      .send({ assetId: faker.string.uuid(), targetPrice: 40 })

    expect(response.status).toBe(404)
    expect(mockPrismaFinanceAssets.priceAlert.create).not.toHaveBeenCalled()
  })

  it('DELETE /price-alerts/:id — should return 404 for an alert of another user', async () => {
    mockPrismaFinanceAssets.priceAlert.findFirst.mockResolvedValue(null)

    const response = await api.delete(`/price-alerts/${faker.string.uuid()}`)

    expect(response.status).toBe(404)
    expect(mockPrismaFinanceAssets.priceAlert.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId }) })
    )
  })
})
