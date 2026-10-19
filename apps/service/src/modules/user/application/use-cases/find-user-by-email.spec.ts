import { makeUser } from '@test/factories/make-user'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UserNotFoundError } from '../errors/user-not-found.error'
import { FindUserByEmailUseCase } from './find-user-by-email'

describe('FindUserByEmailUseCase', () => {
  let inMemoryUserRepository: InMemoryUserRepository
  let sut: FindUserByEmailUseCase

  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository()
    sut = new FindUserByEmailUseCase(inMemoryUserRepository)
  })

  it('should be able to find a user by email', async () => {
    const user = makeUser()
    inMemoryUserRepository.items.push(user)

    const result = await sut.execute(user.email)

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.id).toBe(user.id)
      expect(result.value.name).toBe(user.name)
      expect(result.value.email).toBe(user.email)
    }
  })

  it('should return left with UserNotFoundError when user with given email does not exist', async () => {
    const result = await sut.execute('non-existent@example.com')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
