import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { JOBS, QUEUES } from '@/core/domain/queue/queue.constants'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { BackfillDividendsUseCase } from './backfill-dividends'

class FakeJobPublisher extends DomainJobPublisher {
  public publishBulk = vi.fn(async () => {})
  public publish = vi.fn(async () => {})
}

describe('BackfillDividendsUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let publisher: FakeJobPublisher
  let sut: BackfillDividendsUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    publisher = new FakeJobPublisher()
    sut = new BackfillDividendsUseCase(assetRepository, publisher)
  })

  async function seedAsset(
    userId: string,
    type: CategoryType,
    ticker: string,
    isActive = true
  ) {
    const category = makeCategory({
      userId,
      type,
      currency: type === CategoryType.VARIABLE_US ? 'USD' : 'BRL'
    })
    const asset = makeAsset({
      categoryId: category.id,
      ticker,
      quantity: 10,
      isActive
    })

    await categoryRepository.save(category)
    await assetRepository.save(asset)

    return { category, asset }
  }

  it('should enqueue one backfill job per ticker, only for the user', async () => {
    await seedAsset('user-1', CategoryType.VARIABLE_BR, 'ITSA4')
    await seedAsset('user-1', CategoryType.FII, 'MXRF11')
    await seedAsset('user-1', CategoryType.VARIABLE_US, 'AAPL')
    await seedAsset('user-2', CategoryType.VARIABLE_BR, 'WEGE3')

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 3 })
    expect(publisher.publishBulk).toHaveBeenCalledTimes(1)

    const [queue, jobs] = publisher.publishBulk.mock.calls[0] as unknown as [
      string,
      Array<{ name: string; data: { ticker: string; since: string } }>
    ]

    expect(queue).toBe(QUEUES.DIVIDEND_PROCESSING)
    expect(jobs.map((job) => job.name)).toEqual([
      JOBS.DIVIDEND.SYNC,
      JOBS.DIVIDEND.SYNC,
      JOBS.DIVIDEND.SYNC
    ])
    expect(jobs.map((job) => job.data.ticker).sort()).toEqual([
      'AAPL',
      'ITSA4',
      'MXRF11'
    ])
  })

  it('should send a "since" date matching the requested number of months', async () => {
    await seedAsset('user-1', CategoryType.FII, 'MXRF11')

    await sut.execute('user-1', 6)

    const [, jobs] = publisher.publishBulk.mock.calls[0] as unknown as [
      string,
      Array<{ data: { since: string } }>
    ]
    const since = new Date(jobs[0].data.since)
    const expected = new Date()
    expected.setUTCMonth(expected.getUTCMonth() - 6)

    expect(Math.abs(since.getTime() - expected.getTime())).toBeLessThan(
      3 * 24 * 60 * 60 * 1000
    )
  })

  it('should skip inactive assets, assets without ticker and unsupported types', async () => {
    await seedAsset('user-1', CategoryType.VARIABLE_BR, 'ITSA4', false)
    await seedAsset('user-1', CategoryType.VARIABLE_BR, '')
    await seedAsset('user-1', CategoryType.CRYPTO, 'BTC')
    await seedAsset('user-1', CategoryType.FIXED, 'CDB')

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 0 })
    expect(publisher.publishBulk).not.toHaveBeenCalled()
  })

  it('should group assets with the same ticker into a single job', async () => {
    await seedAsset('user-1', CategoryType.FII, 'MXRF11')
    await seedAsset('user-1', CategoryType.FII, 'MXRF11')

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 1 })

    const [, jobs] = publisher.publishBulk.mock.calls[0] as unknown as [
      string,
      Array<{ data: { targets: unknown[] } }>
    ]
    expect(jobs[0].data.targets).toHaveLength(2)
  })

  it('should skip assets whose dividends were already imported', async () => {
    const { asset } = await seedAsset('user-1', CategoryType.FII, 'MXRF11')
    await seedAsset('user-1', CategoryType.FII, 'BTCI11')
    asset.markDividendsImported(new Date())

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 1 })

    const [, jobs] = publisher.publishBulk.mock.calls[0] as unknown as [
      string,
      Array<{ data: { ticker: string } }>
    ]
    expect(jobs.map((job) => job.data.ticker)).toEqual(['BTCI11'])
  })

  it('should not publish anything when every asset was already imported', async () => {
    const { asset } = await seedAsset('user-1', CategoryType.FII, 'MXRF11')
    asset.markDividendsImported(new Date())

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 0 })
    expect(publisher.publishBulk).not.toHaveBeenCalled()
  })

  it('should import again after the ticker changes', async () => {
    const { asset } = await seedAsset('user-1', CategoryType.FII, 'MXRF11')
    asset.markDividendsImported(new Date())
    asset.update({ ticker: 'BTCI11' })

    const result = await sut.execute('user-1')

    expect(result.value).toEqual({ enqueued: 1 })
  })
})
