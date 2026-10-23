import type { User } from '@/modules/user/domain/user.entity'
import type { UserRepository } from '@/modules/user/domain/user.repository'

export class InMemoryUserRepository implements UserRepository {
  public items: User[] = []

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((item) => item.id === id)
    return user ?? null
  }
}
