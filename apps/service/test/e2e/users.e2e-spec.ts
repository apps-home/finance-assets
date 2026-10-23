import { faker } from '@faker-js/faker'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { FakeStorage } from '@test/storage/fake-storage'
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
import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import {
  StorageBucket,
  StorageFolder
} from '@/core/domain/storage/storage.constant'
import { AllExceptionsFilter } from '@/infra/http/all-exceptions.filter'

describe('Users (E2E)', () => {
  let app: INestApplication
  let fakeStorage: FakeStorage

  const mockPrismaAuth = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    session: {
      findUnique: vi.fn()
    }
  }

  const sessionToken = 'valid-session-token'
  let sessionUserId: string

  function makeRawUser() {
    return {
      id: sessionUserId,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
  let api: ReturnType<typeof request.agent>

  const mockPrismaFinanceAssets = {}

  beforeAll(async () => {
    fakeStorage = new FakeStorage()

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider('prismaAuth')
      .useValue(mockPrismaAuth)
      .overrideProvider('prismaFinanceAssets')
      .useValue(mockPrismaFinanceAssets)
      .overrideProvider(DomainStorage)
      .useValue(fakeStorage)
      .overrideProvider(DomainJobPublisher)
      .useValue({
        publish: vi.fn()
      })
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
    api.set('Authorization', `Bearer ${sessionToken}`)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    fakeStorage.files.clear()

    sessionUserId = faker.string.uuid()

    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId: sessionUserId,
      expiresAt: new Date(Date.now() + 60_000)
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /users/:id — should return 401 without a session token', async () => {
    const response = await request(app.getHttpServer()).get(
      `/users/${faker.string.uuid()}`
    )

    expect(response.status).toBe(401)
  })

  it('GET /users/:id — should return 401 when the session has expired', async () => {
    mockPrismaAuth.session.findUnique.mockResolvedValue({
      userId: faker.string.uuid(),
      expiresAt: new Date(Date.now() - 60_000)
    })

    const response = await api.get(`/users/${sessionUserId}`)

    expect(response.status).toBe(401)
  })

  it('GET /users — should not be exposed (users can only see themselves)', async () => {
    const response = await api.get('/users')

    expect(response.status).toBe(404)
  })

  it('GET /users/by-email — should not be exposed', async () => {
    const response = await api.get('/users/by-email')

    expect(response.status).toBe(404)
  })

  it('GET /users/:id — should return the authenticated user', async () => {
    const rawUser = makeRawUser()

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const response = await api.get(`/users/${rawUser.id}`)

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(rawUser.id)
    expect(response.body.email).toBe(rawUser.email)
  })

  it('GET /users/:id — should return 404 for another user, even when it exists', async () => {
    mockPrismaAuth.user.findUnique.mockResolvedValue(makeRawUser())

    const response = await api.get(`/users/${faker.string.uuid()}`)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('User not found.')
  })

  it('GET /users/:id/download-avatar — should stream avatar file when found', async () => {
    const rawUser = makeRawUser()

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const fileKey = `${StorageFolder.PUBLIC}/${StorageFolder.USERS}/${StorageFolder.AVATARS}/${rawUser.id}`
    await fakeStorage.upload(
      StorageBucket.FINANCE_ASSETS,
      fileKey,
      Buffer.from('fake-avatar-bytes'),
      'image/png'
    )

    const response = await api.get(`/users/${rawUser.id}/download-avatar`)

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain(
      'application/octet-stream'
    )
    expect(response.headers['content-disposition']).toContain(
      'attachment; filename="avatar.png"'
    )
  })

  it('GET /users/:id/download-avatar — should return 500 when avatar does not exist in storage', async () => {
    const rawUser = makeRawUser()

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const response = await api.get(`/users/${rawUser.id}/download-avatar`)

    expect(response.status).toBe(500)
  })
})
