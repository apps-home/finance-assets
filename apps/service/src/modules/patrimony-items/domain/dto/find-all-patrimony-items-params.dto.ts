import { PatrimonyItemType } from '../patrimony-item.entity'

export interface FindAllPatrimonyItemsParams {
  userId: string
  type?: PatrimonyItemType
  isActive?: boolean
}
