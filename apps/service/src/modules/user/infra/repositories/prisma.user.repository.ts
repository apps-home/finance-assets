import { Auth } from '@lib/db'
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

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return null
    }

    return PrismaUserMapper.toDomain(user)
  }

  async list(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return users.map(PrismaUserMapper.toDomain)
  }
}
