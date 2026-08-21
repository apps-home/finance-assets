export abstract class DomainEventPublisher {
  abstract publish<T>(event: string, payload: T): void
}
