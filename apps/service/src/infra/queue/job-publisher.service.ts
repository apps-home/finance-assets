import { getQueueToken } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Queue } from 'bullmq'
import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'

@Injectable()
export class JobPublisherService implements DomainJobPublisher {
  constructor(private readonly moduleRef: ModuleRef) {}

  async publish<T>(queue: string, job: string, payload: T): Promise<void> {
    const queueInstance = this.moduleRef.get<Queue>(getQueueToken(queue), {
      strict: false
    })

    await queueInstance.add(job, payload)
  }

  async publishBulk<T>(
    queue: string,
    jobs: { name: string; data: T; opts?: { delay?: number } }[]
  ): Promise<void> {
    const queueInstance = this.moduleRef.get<Queue>(getQueueToken(queue), {
      strict: false
    })

    await queueInstance.addBulk(jobs)
  }
}
