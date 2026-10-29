import { AuthModule } from '@lib/auth/nest'
import { Module } from '@nestjs/common'

import { PrismaSessionStore } from './auth/prisma-session-store'
import { CronModule } from './cron/cron.module'
import { EnvModule } from './env/env.module'
import { EventModule } from './events/event.module'
import { HttpModule } from './http/http.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PrismaModule } from './prisma/prisma.module'
import { QueueModule } from './queue/queue.module'
import { StorageModule } from './storage/storage.module'

@Module({
  imports: [
    AuthModule.forRoot({ sessionStore: PrismaSessionStore }),
    CronModule,
    EnvModule,
    EventModule,
    HttpModule,
    NotificationsModule,
    PrismaModule,
    QueueModule,
    StorageModule
  ]
})
export class InfraModule {}
