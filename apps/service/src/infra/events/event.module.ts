import { Global, Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'

import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'

import { EventPublisherService } from './event-publisher.service'

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      verboseMemoryLeak: false
    })
  ],
  providers: [
    {
      provide: DomainEventPublisher,
      useClass: EventPublisherService
    }
  ],
  exports: [DomainEventPublisher]
})
export class EventModule {}
