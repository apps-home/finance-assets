import type { Auth } from '@lib/db'
import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(@Inject('prismaAuth') private prisma: Auth) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = this.extractBearerToken(request.headers.authorization)

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing')
    }

    const session = await this.prisma.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true }
    })

    if (!session || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session is invalid or has expired')
    }

    request.userId = session.userId

    return true
  }

  private extractBearerToken(authorization?: string) {
    const [type, token] = authorization?.split(' ') ?? []

    return type === 'Bearer' && token ? token : null
  }
}
