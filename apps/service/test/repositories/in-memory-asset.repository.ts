import type { Asset } from '@/modules/assets/asset/domain/asset.entity'
import type {
  AssetRepository,
  AssetWithCategory,
  AssetWithUserDetails
} from '@/modules/assets/asset/domain/asset.repository'
import type { FindAssetsParams } from '@/modules/assets/asset/domain/dto/find-assets-params.dto'

import type { InMemoryCategoryRepository } from './in-memory-category.repository'

export class InMemoryAssetRepository implements AssetRepository {
  public items: Asset[] = []

  constructor(private categoryRepository: InMemoryCategoryRepository) {}

  async list(params: FindAssetsParams): Promise<AssetWithCategory[]> {
    const result: AssetWithCategory[] = []

    for (const asset of this.items) {
      const category = this.categoryRepository.items.find(
        (item) => item.id === asset.categoryId
      )

      if (!category || category.userId !== params.userId) continue
      if (params.categoryId && category.id !== params.categoryId) continue
      if (params.status && asset.isActive !== (params.status === 'ACTIVE')) {
        continue
      }

      result.push({
        asset,
        category: {
          id: category.id,
          name: category.name,
          type: category.type,
          currency: category.currency
        }
      })
    }

    return result
  }

  async save(asset: Asset): Promise<void> {
    const index = this.items.findIndex((item) => item.id === asset.id)

    if (index >= 0) {
      this.items[index] = asset
    } else {
      this.items.push(asset)
    }
  }

  async findById(id: string, userId: string): Promise<Asset | null> {
    const asset = await this.findByIdForSystem(id)
    if (!asset) return null

    const category = this.categoryRepository.items.find(
      (item) => item.id === asset.categoryId
    )

    return category?.userId === userId ? asset : null
  }

  async findByIdForSystem(id: string): Promise<Asset | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findAllIndexedFixedIncome(): Promise<Asset[]> {
    return this.items.filter((item) => item.isActive && item.indexer !== null)
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }

  async markDividendsImported(assetIds: string[], at: Date): Promise<void> {
    for (const asset of this.items) {
      if (assetIds.includes(asset.id)) {
        asset.markDividendsImported(at)
      }
    }
  }

  async findAllActiveWithUserDetails(): Promise<AssetWithUserDetails[]> {
    return []
  }
}
