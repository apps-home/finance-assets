import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { AssetNotFoundError } from '../errors/asset-not-found.error'
import { DeleteAssetUseCase } from './delete-asset'

describe('DeleteAssetUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let sut: DeleteAssetUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    sut = new DeleteAssetUseCase(assetRepository)

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' })
    )
  })

  it('should delete only the requested asset', async () => {
    const target = makeAsset({ categoryId: 'category-1' })
    const other = makeAsset({ categoryId: 'category-1' })
    assetRepository.items.push(target, other)

    const result = await sut.execute('user-1', target.id)

    expect(result.isRight()).toBe(true)
    expect(assetRepository.items).toEqual([other])
  })

  it('should return not found for an unknown asset', async () => {
    const result = await sut.execute('user-1', 'unknown')

    expect(result.value).toBeInstanceOf(AssetNotFoundError)
  })
})
