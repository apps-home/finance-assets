import { makeUser } from '@test/factories/make-user'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserNotFoundError } from '../errors/user-not-found.error'
import { FindUserByIdUseCase } from './find-user'

describe('FindUserByIdUseCase', () => {
  let inMemoryUserRepository: InMemoryUserRepository
  let sut: FindUserByIdUseCase

  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository()
    sut = new FindUserByIdUseCase(inMemoryUserRepository)
  })

  it('should be able to find a user by id', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const result = await sut.execute(user.id, user.id)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id).toBe(user.id)
      expect(result.value.name).toBe(user.name)
      expect(result.value.email).toBe(user.email)
    }
  })

  it('should not find another user, even when it exists', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const result = await sut.execute('another-user-id', user.id)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })

  it('should return left with UserNotFoundError when user is not found', async () => {
    const result = await sut.execute('non-existent-id', 'non-existent-id')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
