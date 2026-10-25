import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'

import { CreateDividendUseCase } from './create-dividend'

describe('CreateDividendUseCase', () => {
  let dividendRepository: InMemoryDividendRepository
  let assetRepository: InMemoryAssetRepository
  let categoryRepository: InMemoryCategoryRepository
  let sut: CreateDividendUseCase

  beforeEach(() => {
    dividendRepository = new InMemoryDividendRepository()
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    sut = new CreateDividendUseCase(
      dividendRepository,
      assetRepository,
      categoryRepository
    )
  })

  async function seed(currency = 'BRL', quantity = 100) {
    const category = makeCategory({ userId: 'user-1', currency })
    const asset = makeAsset({ categoryId: category.id, quantity })

    await categoryRepository.save(category)
    await assetRepository.save(asset)

    return asset
  }

  it('should create a dividend with an explicit amount', async () => {
    const asset = await seed()

    const result = await sut.execute({
      userId: 'user-1',
      assetId: asset.id,
      amount: 150.5,
      paymentDate: new Date('2026-03-10')
    })

    expect(result.isRight()).toBe(true)
    expect(dividendRepository.items).toHaveLength(1)
    expect(dividendRepository.items[0].amount).toBe(150.5)
  })

  it('should compute the amount from the rate and the asset quantity', async () => {
    const asset = await seed('BRL', 200)

    await sut.execute({
      userId: 'user-1',
      assetId: asset.id,
      rateAmount: 0.1,
      paymentDate: new Date('2026-03-10')
    })

    expect(dividendRepository.items[0].amount).toBe(20)
  })

  it('should fail when neither amount nor rate is provided', async () => {
    const asset = await seed()

    const result = await sut.execute({
      userId: 'user-1',
      assetId: asset.id,
      paymentDate: new Date('2026-03-10')
    })

    expect(result.value).toBeInstanceOf(PayloadError)
  })

  it('should require an exchange rate for foreign currency assets', async () => {
    const asset = await seed('USD')

    const result = await sut.execute({
      userId: 'user-1',
      assetId: asset.id,
      amount: 10,
      paymentDate: new Date('2026-03-10')
    })

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(dividendRepository.items).toHaveLength(0)
  })

  it('should not create a dividend for an asset of another user', async () => {
    const asset = await seed()

    const result = await sut.execute({
      userId: 'user-2',
      assetId: asset.id,
      amount: 10,
      paymentDate: new Date('2026-03-10')
    })

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })

  it('should reject a duplicated dividend for the same asset, type and date', async () => {
    const asset = await seed()
    const payload = {
      userId: 'user-1',
      assetId: asset.id,
      amount: 10,
      paymentDate: new Date('2026-03-10')
    }

    await sut.execute(payload)
    const result = await sut.execute(payload)

    expect(result.value).toBeInstanceOf(PayloadError)
    expect(dividendRepository.items).toHaveLength(1)
  })
})
