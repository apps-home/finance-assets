import { Budget } from './budget.entity'
import { FindAllBudgetsParams } from './dto/find-all-budgets-params.dto'

export abstract class BudgetRepository {
  abstract list(params: FindAllBudgetsParams): Promise<Budget[]>
  abstract save(budget: Budget): Promise<void>
  abstract findById(id: string): Promise<Budget | null>
  abstract delete(id: string): Promise<void>
}
