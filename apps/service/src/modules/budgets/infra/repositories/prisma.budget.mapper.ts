import { Prisma } from '@lib/db'
import { Budget } from '../../domain/budget.entity'

export class PrismaBudgetMapper {
  static toDomain(raw: Prisma.AssetRecordGetPayload<{}>): Budget {
    return Budget.create({
      id: raw.id,
      categoryId: raw.categoryId,
      month: raw.month,
      year: raw.year,
      amount: Number(raw.amount),
      exchangeRate: Number(raw.exchangeRate) || null,
      dividendAmount: raw.dividendAmount ? Number(raw.dividendAmount) : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }

  static toPrisma(budget: Budget) {
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      month: budget.month,
      year: budget.year,
      amount: budget.amount,
      exchangeRate: budget.exchangeRate,
      dividendAmount: budget.dividendAmount,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt
    }
  }
}
