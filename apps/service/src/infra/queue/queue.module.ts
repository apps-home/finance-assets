import { BullModule } from '@nestjs/bullmq'
import { Global, Module } from '@nestjs/common'
import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { QUEUES } from '../../core/domain/queue/queue.constants'
import { EnvService } from '../env/env.service'
import { JobPublisherService } from './job-publisher.service'

const ALL_QUEUES = Object.values(QUEUES).map(name => ({ name }))

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        connection: {
          host: env.get('REDIS_HOST'),
          port: env.get('REDIS_PORT'),
          password: env.get('REDIS_PASSWORD')
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      })
    }),
    BullModule.registerQueue(...ALL_QUEUES)
  ],
  providers: [
    {
      provide: DomainJobPublisher,
      useClass: JobPublisherService
    }
  ],
  exports: [BullModule, DomainJobPublisher]
})
export class QueueModule {}
