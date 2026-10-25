import type {
  Dividend,
  DividendType
} from '@/modules/dividends/domain/dividend.entity'
import type {
  DividendRepository,
  DividendWithAsset
} from '@/modules/dividends/domain/dividend.repository'

export class InMemoryDividendRepository implements DividendRepository {
  public items: Dividend[] = []

  async list(): Promise<DividendWithAsset[]> {
    return []
  }

  async save(dividend: Dividend): Promise<void> {
    const index = this.items.findIndex((item) => item.id === dividend.id)

    if (index >= 0) {
      this.items[index] = dividend
    } else {
      this.items.push(dividend)
    }
  }

  async findById(id: string, userId: string): Promise<Dividend | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    )
  }

  async findByNaturalKey(
    assetId: string,
    type: DividendType,
    paymentDate: Date
  ): Promise<Dividend | null> {
    return (
      this.items.find(
        (item) =>
          item.assetId === assetId &&
          item.type === type &&
          item.paymentDate.getTime() === paymentDate.getTime()
      ) ?? null
    )
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
