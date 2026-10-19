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

describe('Users (E2E)', () => {
  let app: INestApplication
  let fakeStorage: FakeStorage

  const mockPrismaAuth = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    }
  }

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

    await app.init()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    fakeStorage.files.clear()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /users — should return all users', async () => {
    const rawUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: faker.image.avatar(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrismaAuth.user.findMany.mockResolvedValue([rawUser])

    const response = await request(app.getHttpServer()).get('/users')

    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].id).toBe(rawUser.id)
    expect(response.body[0].email).toBe(rawUser.email)
    expect(response.body[0].name).toBe(rawUser.name)
  })

  it('GET /users/:id — should return user by id when exists', async () => {
    const rawUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const response = await request(app.getHttpServer()).get(
      `/users/${rawUser.id}`
    )

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(rawUser.id)
    expect(response.body.email).toBe(rawUser.email)
  })

  it('GET /users/:id — should return 404 when user is not found', async () => {
    mockPrismaAuth.user.findUnique.mockResolvedValue(null)

    const response = await request(app.getHttpServer()).get(
      `/users/${faker.string.uuid()}`
    )

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('User not found')
  })

  it('GET /users/by-email — should return user by email when exists', async () => {
    const rawUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const response = await request(app.getHttpServer())
      .get('/users/by-email')
      .query({ email: rawUser.email })

    expect(response.status).toBe(200)
    expect(response.body.id).toBe(rawUser.id)
    expect(response.body.email).toBe(rawUser.email)
  })

  it('GET /users/by-email — should return 404 when user email is not found', async () => {
    mockPrismaAuth.user.findUnique.mockResolvedValue(null)

    const response = await request(app.getHttpServer())
      .get('/users/by-email')
      .query({ email: 'unknown@example.com' })

    expect(response.status).toBe(404)
    expect(response.body.message).toBe('User not found')
  })

  it('GET /users/:id/download-avatar — should stream avatar file when found', async () => {
    const rawUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const fileKey = `${StorageFolder.PUBLIC}/${StorageFolder.USERS}/${StorageFolder.AVATARS}/${rawUser.id}`
    await fakeStorage.upload(
      StorageBucket.FINANCE_ASSETS,
      fileKey,
      Buffer.from('fake-avatar-bytes'),
      'image/png'
    )

    const response = await request(app.getHttpServer()).get(
      `/users/${rawUser.id}/download-avatar`
    )

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain(
      'application/octet-stream'
    )
    expect(response.headers['content-disposition']).toContain(
      'attachment; filename="avatar.png"'
    )
  })

  it('GET /users/:id/download-avatar — should return 500 when avatar does not exist in storage', async () => {
    const rawUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockPrismaAuth.user.findUnique.mockResolvedValue(rawUser)

    const response = await request(app.getHttpServer()).get(
      `/users/${rawUser.id}/download-avatar`
    )

    expect(response.status).toBe(500)
  })
})
