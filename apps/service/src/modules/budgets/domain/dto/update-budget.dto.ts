import { CreateBudgetPayload } from './create-budget.dto'

export type UpdateBudgetPayload = Partial<
  Omit<CreateBudgetPayload, 'categoryId' | 'month' | 'year'>
>
