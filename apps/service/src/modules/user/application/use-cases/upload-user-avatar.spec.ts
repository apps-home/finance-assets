import { makeUser } from '@test/factories/make-user'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { FakeStorage } from '@test/storage/fake-storage'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserNotFoundError } from '../errors/user-not-found.error'
import { UploadUserAvatarUseCase } from './upload-user-avatar'

describe('UploadUserAvatarUseCase', () => {
  let inMemoryUserRepository: InMemoryUserRepository
  let fakeStorage: FakeStorage
  let sut: UploadUserAvatarUseCase

  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository()
    fakeStorage = new FakeStorage()
    sut = new UploadUserAvatarUseCase(fakeStorage, inMemoryUserRepository)
  })

  it('should be able to upload a user avatar', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const file = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image-content'),
      size: 18,
      destination: '',
      filename: 'avatar.png',
      path: '',
      stream: null as never
    } as Express.Multer.File

    const result = await sut.execute({
      currentUserId: user.id,
      userId: user.id,
      file
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fileName).toContain(user.id)
      expect(result.value.fileName).toMatch(/\.png$/)
      expect(fakeStorage.files.size).toBe(1)
    }
  })

  it('should return left with UserNotFoundError if user does not exist', async () => {
    const file = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image-content'),
      size: 18,
      destination: '',
      filename: 'avatar.png',
      path: '',
      stream: null as never
    } as Express.Multer.File

    const result = await sut.execute({
      currentUserId: 'non-existent-user',
      userId: 'non-existent-user',
      file
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(fakeStorage.files.size).toBe(0)
  })

  it('should not upload an avatar for another user', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const result = await sut.execute({
      currentUserId: 'another-user-id',
      userId: user.id,
      file: {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        buffer: Buffer.from('fake-image-content')
      } as Express.Multer.File
    })

    expect(result.value).toBeInstanceOf(UserNotFoundError)
    expect(fakeStorage.files.size).toBe(0)
  })

  it('should return left with error if storage upload fails', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    vi.spyOn(fakeStorage, 'upload').mockRejectedValueOnce(
      new Error('Upload failed')
    )

    const file = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('fake-image-content'),
      size: 18,
      destination: '',
      filename: 'avatar.png',
      path: '',
      stream: null as never
    } as Express.Multer.File

    const result = await sut.execute({
      currentUserId: user.id,
      userId: user.id,
      file
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
    expect((result.value as Error).message).toBe('Upload failed')
  })
})
