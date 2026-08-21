import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'

@Injectable()
export class EventPublisherService implements DomainEventPublisher {
  constructor(private readonly eventEmmiter: EventEmitter2) {}

  publish<T>(event: string, payload: T): void {
    this.eventEmmiter.emit(event, payload)
  }
}
