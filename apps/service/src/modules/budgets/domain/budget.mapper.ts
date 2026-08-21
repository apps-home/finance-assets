import { Budget, BudgetProps } from './budget.entity'
import { CreateBudgetPayload } from './dto/create-budget.dto'

export class BudgetMapper {
  static toDomain(raw: CreateBudgetPayload): Budget {
    return Budget.create({
      categoryId: raw.categoryId,
      month: raw.month,
      year: raw.year,
      amount: raw.amount,
      exchangeRate: raw.exchangeRate,
      dividendAmount: raw.dividendAmount
    })
  }

  static toHTTP(budget: Budget): BudgetProps {
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
