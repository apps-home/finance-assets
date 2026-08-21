import { Module } from '@nestjs/common'
import { CronModule } from './cron/cron.module'
import { EnvModule } from './env/env.module'
import { EventModule } from './events/event.module'
import { HttpModule } from './http/http.module'
import { PrismaModule } from './prisma/prisma.module'
import { QueueModule } from './queue/queue.module'
import { StorageModule } from './storage/storage.module'

@Module({
  imports: [
    CronModule,
    EnvModule,
    EventModule,
    HttpModule,
    PrismaModule,
    QueueModule,
    StorageModule
  ]
})
export class InfraModule {}
