import { FindAllPatrimonyItemsParams } from '@/modules/patrimony-items/domain/dto/find-all-patrimony-items-params.dto'
import { PatrimonyItem } from '@/modules/patrimony-items/domain/patrimony-item.entity'
import { PatrimonyItemRepository } from '@/modules/patrimony-items/domain/patrimony-item.repository'

export class InMemoryPatrimonyItemRepository
  implements PatrimonyItemRepository
{
  public items: PatrimonyItem[] = []

  async list(params: FindAllPatrimonyItemsParams): Promise<PatrimonyItem[]> {
    return this.items.filter(
      (item) =>
        item.userId === params.userId &&
        (params.type === undefined || item.type === params.type) &&
        (params.isActive === undefined || item.isActive === params.isActive)
    )
  }

  async findById(id: string, userId: string): Promise<PatrimonyItem | null> {
    return (
      this.items.find((item) => item.id === id && item.userId === userId) ??
      null
    )
  }

  async save(item: PatrimonyItem): Promise<void> {
    const index = this.items.findIndex((existing) => existing.id === item.id)

    if (index >= 0) {
      this.items[index] = item
    } else {
      this.items.push(item)
    }
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
