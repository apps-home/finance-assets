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

describe('Assets (E2E)', () => {
  let app: INestApplication
  let api: ReturnType<typeof request.agent>

  const userId = faker.string.uuid()

  const mockPrismaAuth = {
    user: { findUnique: vi.fn(), findMany: vi.fn() },
    session: { findUnique: vi.fn() }
  }

  const mockPrismaFinanceAssets = {
    asset: { findFirst: vi.fn(), findMany: vi.fn() },
    assetCategory: { findFirst: vi.fn() }
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

  it('GET /assets — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get('/assets')

    expect(response.status).toBe(401)
  })

  it('GET /assets — should scope the query to the session user', async () => {
    mockPrismaFinanceAssets.asset.findMany.mockResolvedValue([])

    const response = await api.get('/assets')

    expect(response.status).toBe(200)
    expect(mockPrismaFinanceAssets.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: expect.objectContaining({ userId })
        })
      })
    )
  })

  it('GET /assets/:id — should return 400 for an invalid uuid', async () => {
    const response = await api.get('/assets/not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('GET /assets/:id — should return 404 when the asset is not found', async () => {
    mockPrismaFinanceAssets.asset.findFirst.mockResolvedValue(null)

    const response = await api.get(`/assets/${faker.string.uuid()}`)

    expect(response.status).toBe(404)
    expect(mockPrismaFinanceAssets.asset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: { userId } })
      })
    )
  })

  it('POST /assets — should return 404 when the category is not found', async () => {
    mockPrismaFinanceAssets.assetCategory.findFirst.mockResolvedValue(null)

    const response = await api.post('/assets').send({
      name: 'Tesouro Selic',
      categoryId: faker.string.uuid()
    })

    expect(response.status).toBe(404)
  })
})
