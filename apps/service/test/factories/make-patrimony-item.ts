import {
  PatrimonyItem,
  PatrimonyItemProps,
  PatrimonyItemType
} from '@/modules/patrimony-items/domain/patrimony-item.entity'

export function makePatrimonyItem(
  override: Partial<PatrimonyItemProps> = {}
): PatrimonyItem {
  return PatrimonyItem.create({
    id: override.id ?? crypto.randomUUID(),
    userId: override.userId ?? 'user-1',
    name: override.name ?? 'Carro (Tabela FIPE)',
    type: override.type ?? PatrimonyItemType.VEHICLE,
    currentValue: override.currentValue ?? 65_000,
    purchaseValue:
      override.purchaseValue !== undefined ? override.purchaseValue : 70_000,
    acquiredAt: override.acquiredAt ?? null,
    notes: override.notes ?? null,
    isActive: override.isActive ?? true,
    createdAt: override.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: override.updatedAt ?? new Date('2026-01-01T00:00:00.000Z')
  })
}
