import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { FindAssetByIdUseCase } from './find-asset-by-id'

describe('FindAssetByIdUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let sut: FindAssetByIdUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    sut = new FindAssetByIdUseCase(assetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' })
    )
  })

  it('should return the asset as a plain object', async () => {
    const asset = makeAsset({
      categoryId: 'category-1',
      name: 'Weg',
      ticker: 'WEGE3',
      quantity: 10,
      averagePrice: 30
    })
    assetRepository.items.push(asset)

    const result = await sut.execute('user-1', asset.id)

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      id: asset.id,
      categoryId: 'category-1',
      name: 'Weg',
      ticker: 'WEGE3',
      quantity: 10,
      averagePrice: 30
    })
  })

  it('should return not found for an unknown asset', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })
})
