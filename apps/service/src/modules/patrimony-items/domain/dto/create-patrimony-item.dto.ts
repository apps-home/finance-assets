import { PatrimonyItemType } from '../patrimony-item.entity'

export interface CreatePatrimonyItemPayload {
  userId: string
  name: string
  type: PatrimonyItemType
  currentValue: number
  purchaseValue?: number | null
  acquiredAt?: Date | null
  notes?: string | null
  isActive?: boolean
}
