import { faker } from '@faker-js/faker'

import {
  Budget,
  type BudgetProps
} from '@/modules/budgets/domain/budget.entity'

export function makeBudget(
  override: Partial<BudgetProps> & Pick<BudgetProps, 'categoryId'>
): Budget {
  return Budget.create({
    month: faker.number.int({ min: 1, max: 12 }),
    year: new Date().getFullYear(),
    amount: faker.number.int({ min: 100, max: 10000 }),
    exchangeRate: 1,
    ...override
  })
}
