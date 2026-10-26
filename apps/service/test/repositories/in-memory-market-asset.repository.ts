import type { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'
import type { MarketAssetRepository } from '@/modules/assets/market-asset/domain/market-asset.repository'

export class InMemoryMarketAssetRepository implements MarketAssetRepository {
  public items: MarketAsset[] = []

  async findById(id: string): Promise<MarketAsset | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findOrCreate(marketAsset: MarketAsset): Promise<MarketAsset> {
    const existing = this.items.find(
      (item) =>
        item.ticker === marketAsset.ticker && item.type === marketAsset.type
    )

    if (existing) return existing

    this.items.push(marketAsset)

    return marketAsset
  }

  async save(marketAsset: MarketAsset): Promise<void> {
    const index = this.items.findIndex((item) => item.id === marketAsset.id)

    if (index >= 0) {
      this.items[index] = marketAsset
    } else {
      this.items.push(marketAsset)
    }
  }

  async findAllInUse(): Promise<MarketAsset[]> {
    return this.items
  }
}
