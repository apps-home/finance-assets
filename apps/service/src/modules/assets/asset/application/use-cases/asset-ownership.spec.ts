import { FakeEventPublisher } from '@test/events/fake-event-publisher'
import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { makeMarketAssetUseCases } from '@test/market-asset/make-market-asset-use-cases'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { DeleteAssetUseCase } from './delete-asset'
import { FindAssetByIdUseCase } from './find-asset-by-id'
import { UpdateAssetUseCase } from './update-asset'

describe('Asset use cases ownership', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let assetId: string

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)

    const category = makeCategory({ userId: 'user-1' })
    const asset = makeAsset({ categoryId: category.id })

    categoryRepository.items.push(category)
    assetRepository.items.push(asset)
    assetId = asset.id
  })

  it('should find an asset that belongs to the user', async () => {
    const sut = new FindAssetByIdUseCase(assetRepository)

    const result = await sut.execute('user-1', assetId)

    expect(result.isRight()).toBe(true)
  })

  it('should not find an asset that belongs to another user', async () => {
    const sut = new FindAssetByIdUseCase(assetRepository)

    const result = await sut.execute('user-2', assetId)

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })

  it('should update an asset that belongs to the user', async () => {
    const sut = new UpdateAssetUseCase(
      assetRepository,
      categoryRepository,
      makeMarketAssetUseCases().resolve,
      new FakeEventPublisher()
    )

    const result = await sut.execute('user-1', assetId, { name: 'Novo nome' })

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items[0].name).toBe('Novo nome')
  })

  it('should not update an asset that belongs to another user', async () => {
    const sut = new UpdateAssetUseCase(
      assetRepository,
      categoryRepository,
      makeMarketAssetUseCases().resolve,
      new FakeEventPublisher()
    )

    const result = await sut.execute('user-2', assetId, { name: 'Invasor' })

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
    expect(assetRepository.items[0].name).not.toBe('Invasor')
  })

  it('should delete an asset that belongs to the user', async () => {
    const sut = new DeleteAssetUseCase(assetRepository)

    const result = await sut.execute('user-1', assetId)

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items).toHaveLength(0)
  })

  it('should not delete an asset that belongs to another user', async () => {
    const sut = new DeleteAssetUseCase(assetRepository)

    const result = await sut.execute('user-2', assetId)

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
    expect(assetRepository.items).toHaveLength(1)
  })
})
