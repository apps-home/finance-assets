import type { PatrimonyItem as PrismaPatrimonyItem } from '@lib/finance-assets-db'

import {
  PatrimonyItem,
  PatrimonyItemType
} from '../../domain/patrimony-item.entity'

export class PrismaPatrimonyItemMapper {
  static toDomain(raw: PrismaPatrimonyItem): PatrimonyItem {
    return PatrimonyItem.create({
      id: raw.id,
      userId: raw.userId,
      name: raw.name,
      type: raw.type as PatrimonyItemType,
      currentValue: Number(raw.currentValue),
      purchaseValue:
        raw.purchaseValue != null ? Number(raw.purchaseValue) : null,
      acquiredAt: raw.acquiredAt ?? null,
      notes: raw.notes ?? null,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(item: PatrimonyItem) {
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
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }
  }
}
