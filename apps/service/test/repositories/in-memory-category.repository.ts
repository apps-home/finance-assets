import type { Category } from '@/modules/assets/categories/domain/category.entity'
import type { CategoryRepository } from '@/modules/assets/categories/domain/category.repository'

export class InMemoryCategoryRepository implements CategoryRepository {
  public items: Category[] = []

  async list(): Promise<Category[]> {
    return this.items
  }

  async save(category: Category): Promise<void> {
    const index = this.items.findIndex((item) => item.id === category.id)

    if (index >= 0) {
      this.items[index] = category
    } else {
      this.items.push(category)
    }
  }

  async findById(id: string): Promise<Category | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }
}
