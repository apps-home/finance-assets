import { makeUser } from '@test/factories/make-user'
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ListUsersUseCase } from './list-users'

describe('ListUsersUseCase', () => {
  let inMemoryUserRepository: InMemoryUserRepository
  let sut: ListUsersUseCase

  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository()
    sut = new ListUsersUseCase(inMemoryUserRepository)
  })

  it('should return an empty list when there are no users', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toHaveLength(0)
    }
  })

  it('should return all users', async () => {
    const user1 = makeUser()
    const user2 = makeUser()
    inMemoryUserRepository.items.push(user1, user2)

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0].id).toBe(user1.id)
      expect(result.value[1].id).toBe(user2.id)
    }
  })
})
