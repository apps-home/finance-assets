import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest().userId
)
