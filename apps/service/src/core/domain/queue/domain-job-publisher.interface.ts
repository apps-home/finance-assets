export abstract class DomainJobPublisher {
  abstract publish<T>(queue: string, job: string, payload: T): Promise<void>
  abstract publishBulk<T>(
    queue: string,
    jobs: { name: string; data: T; opts?: { delay?: number } }[]
  ): Promise<void>
}
