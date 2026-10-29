import { SessionStore, type StoredSession } from '@lib/auth/nest'
import type { Auth } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class PrismaSessionStore extends SessionStore {
  constructor(@Inject('prismaAuth') private prisma: Auth) {
    super()
  }

  findByToken(token: string): Promise<StoredSession | null> {
    return this.prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true }
    })
  }
}
