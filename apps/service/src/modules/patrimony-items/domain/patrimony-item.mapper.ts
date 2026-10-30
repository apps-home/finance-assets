import { CreatePatrimonyItemPayload } from './dto/create-patrimony-item.dto'
import { PatrimonyItem, PatrimonyItemProps } from './patrimony-item.entity'

export interface PatrimonyItemHTTP extends PatrimonyItemProps {
  isAsset: boolean
  isLiability: boolean
}

export class PatrimonyItemMapper {
  static toDomain(raw: CreatePatrimonyItemPayload): PatrimonyItem {
    return PatrimonyItem.create({
      userId: raw.userId,
      name: raw.name,
      type: raw.type,
      currentValue: raw.currentValue,
      purchaseValue: raw.purchaseValue ?? null,
      acquiredAt: raw.acquiredAt ?? null,
      notes: raw.notes ?? null,
      isActive: raw.isActive ?? true
    })
  }

  static toHTTP(item: PatrimonyItem): PatrimonyItemHTTP {
    return {
      id: item.id,
      userId: item.userId,
      name: item.name,
      type: item.type,
      currentValue: item.currentValue,
      purchaseValue: item.purchaseValue,
      acquiredAt: item.acquiredAt,
      notes: item.notes,
      isActive: item.isActive,
      isAsset: item.isAsset,
      isLiability: item.isLiability,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }
  }
}
