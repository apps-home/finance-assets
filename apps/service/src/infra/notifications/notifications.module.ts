import { Global, Module } from '@nestjs/common'

import { DomainNotifier } from '@/core/domain/notifications/domain-notifier.interface'

import { EnvService } from '../env/env.service'
import { NotificationsController } from './notifications.controller'
import { createNovuClient, NOVU_CLIENT } from './novu.client'
import { NovuInboxService } from './novu-inbox.service'
import { NovuNotifier } from './novu-notifier'

@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOVU_CLIENT,
      inject: [EnvService],
      useFactory: createNovuClient
    },
    {
      provide: DomainNotifier,
      useClass: NovuNotifier
    },
    NovuInboxService
  ],
  exports: [DomainNotifier]
})
export class NotificationsModule {}
