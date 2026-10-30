import { FindAllPatrimonyItemsParams } from './dto/find-all-patrimony-items-params.dto'
import { PatrimonyItem } from './patrimony-item.entity'

export abstract class PatrimonyItemRepository {
  abstract list(params: FindAllPatrimonyItemsParams): Promise<PatrimonyItem[]>
  abstract findById(id: string, userId: string): Promise<PatrimonyItem | null>
  abstract save(item: PatrimonyItem): Promise<void>
  abstract delete(id: string): Promise<void>
}
