import { Controller, Get } from '@nestjs/common'

import { CurrentUserId } from '@/infra/auth/current-user-id.decorator'

import { NovuInboxService } from './novu-inbox.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly novuInboxService: NovuInboxService) {}

  /** Credenciais do Inbox do usuário da sessão; `{ enabled: false }` sem Novu */
  @Get('inbox-session')
  inboxSession(@CurrentUserId() userId: string) {
    return this.novuInboxService.getSession(userId)
  }
}
