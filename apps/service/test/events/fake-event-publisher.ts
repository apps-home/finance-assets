import type { DomainEventPublisher } from '@/core/domain/events/domain-event-publisher.interface'

export class FakeEventPublisher implements DomainEventPublisher {
  public published: { event: string; payload: unknown }[] = []

  publish<T>(event: string, payload: T): void {
    this.published.push({ event, payload })
  }
}
