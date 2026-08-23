import { FinanceAssets } from '@lib/db'
import { Inject, Injectable } from '@nestjs/common'

import { Budget } from '../../domain/budget.entity'
import { BudgetRepository } from '../../domain/budget.repository'
import { FindAllBudgetsParams } from '../../domain/dto/find-all-budgets-params.dto'
import { PrismaBudgetMapper } from './prisma.budget.mapper'

@Injectable()
export class PrismaBudgetRepository implements BudgetRepository {
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list(params: FindAllBudgetsParams): Promise<Budget[]> {
    const { userId, categoryId, month, year } = params

    const budgetRecords = await this.prisma.assetRecord.findMany({
      where: {
        ...(userId && { category: { userId } }),
        ...(categoryId && { categoryId }),
        ...(month && { month }),
        ...(year && { year })
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    })

    return budgetRecords.map(PrismaBudgetMapper.toDomain)
  }

  async save(budget: Budget): Promise<void> {
    const createBudget = PrismaBudgetMapper.toPrisma(budget)

    await this.prisma.assetRecord.upsert({
      where: {
        categoryId_month_year: {
          categoryId: budget.categoryId,
          month: budget.month,
          year: budget.year
        }
      },
      create: createBudget,
      update: {
        amount: budget.amount,
        exchangeRate: budget.exchangeRate,
        dividendAmount: budget.dividendAmount,
        updatedAt: budget.updatedAt
      }
    })
  }

  async findById(id: string): Promise<Budget | null> {
    const budgetRecord = await this.prisma.assetRecord.findUnique({
      where: { id }
    })

    if (!budgetRecord) {
      return null
    }

    return PrismaBudgetMapper.toDomain(budgetRecord)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetRecord.delete({
      where: { id }
    })
  }
}
