import { makeUser } from '@test/factories/make-user'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { FakeStorage } from '@test/storage/fake-storage'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  StorageBucket,
  StorageFolder
} from '@/core/domain/storage/storage.constant'

import { UserNotFoundError } from '../errors/user-not-found.error'
import { DownloadUserAvatarUseCase } from './download-avatar'

describe('DownloadUserAvatarUseCase', () => {
  let inMemoryUserRepository: InMemoryUserRepository
  let fakeStorage: FakeStorage
  let sut: DownloadUserAvatarUseCase

  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository()
    fakeStorage = new FakeStorage()
    sut = new DownloadUserAvatarUseCase(fakeStorage, inMemoryUserRepository)
  })

  it('should be able to download a user avatar', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const fileKey = `${StorageFolder.PUBLIC}/${StorageFolder.USERS}/${StorageFolder.AVATARS}/${user.id}`
    await fakeStorage.upload(
      StorageBucket.FINANCE_ASSETS,
      fileKey,
      Buffer.from('avatar-data'),
      'image/png'
    )

    const result = await sut.execute({ userId: user.id })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.file).toBeDefined()
    }
  })

  it('should return left with UserNotFoundError if user does not exist', async () => {
    const result = await sut.execute({ userId: 'non-existent-user' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })

  it('should return left with error if storage download fails', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    vi.spyOn(fakeStorage, 'download').mockRejectedValueOnce(
      new Error('File not found')
    )

    const result = await sut.execute({ userId: user.id })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(Error)
    expect((result.value as Error).message).toBe('File not found')
  })
})
