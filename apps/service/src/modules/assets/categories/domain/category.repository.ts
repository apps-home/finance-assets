import { Category } from './category.entity'
import { FindAllCategoriesParams } from './dto/find-all-categories-params.dto'

export abstract class CategoryRepository {
  abstract list(params: FindAllCategoriesParams): Promise<Category[]>
  abstract save(category: Category): Promise<void>
  abstract findById(id: string): Promise<Category | null>
  abstract delete(id: string): Promise<void>
}
