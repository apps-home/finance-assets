import type { Auth } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { User } from '../../domain/user.entity'
import { UserRepository } from '../../domain/user.repository'
import { PrismaUserMapper } from './prisma.user.mapper'

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(@Inject('prismaAuth') private prisma: Auth) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }
}
