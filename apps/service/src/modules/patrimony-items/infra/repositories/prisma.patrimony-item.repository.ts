import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { FindAllPatrimonyItemsParams } from '../../domain/dto/find-all-patrimony-items-params.dto'
import { PatrimonyItem } from '../../domain/patrimony-item.entity'
import { PatrimonyItemRepository } from '../../domain/patrimony-item.repository'
import { PrismaPatrimonyItemMapper } from './prisma.patrimony-item.mapper'

@Injectable()
export class PrismaPatrimonyItemRepository implements PatrimonyItemRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAllPatrimonyItemsParams): Promise<PatrimonyItem[]> {
    const { userId, type, isActive } = params

    const rows = await this.prisma.patrimonyItem.findMany({
      where: {
        userId,
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive })
      },
      orderBy: [{ isActive: 'desc' }, { currentValue: 'desc' }, { name: 'asc' }]
    })

    return rows.map(PrismaPatrimonyItemMapper.toDomain)
  }

  async findById(id: string, userId: string): Promise<PatrimonyItem | null> {
    const row = await this.prisma.patrimonyItem.findFirst({
      where: { id, userId }
    })

    if (!row) return null

    return PrismaPatrimonyItemMapper.toDomain(row)
  }

  async save(item: PatrimonyItem): Promise<void> {
    const data = PrismaPatrimonyItemMapper.toPrisma(item)

    await this.prisma.patrimonyItem.upsert({
      where: { id: item.id },
      create: data,
      update: {
        name: item.name,
        type: item.type,
        currentValue: item.currentValue,
        purchaseValue: item.purchaseValue,
        acquiredAt: item.acquiredAt,
        notes: item.notes,
        isActive: item.isActive,
        updatedAt: item.updatedAt
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.patrimonyItem.delete({
      where: { id }
    })
  }
}
