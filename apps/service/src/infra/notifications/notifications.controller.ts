import { CurrentUserId } from '@lib/auth/nest'
import { Controller, Get } from '@nestjs/common'

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
