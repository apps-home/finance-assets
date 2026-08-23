import { Module } from '@nestjs/common'

import { CategoryModule } from '../assets/categories/category.module'
import { CreateBudgetUseCase } from './application/use-cases/create-budget'
import { DeleteBudgetUseCase } from './application/use-cases/delete-budget'
import { FindAllBudgetsUseCase } from './application/use-cases/find-all-budgets'
import { FindBudgetByIdUseCase } from './application/use-cases/find-budget-by-id'
import { UpdateBudgetUseCase } from './application/use-cases/update-budget'
import { BudgetRepository } from './domain/budget.repository'
import { BudgetController } from './infra/budget.controller'
import { PrismaBudgetRepository } from './infra/repositories/prisma.budget.repository'

@Module({
  imports: [CategoryModule],
  controllers: [BudgetController],
  providers: [
    { provide: BudgetRepository, useClass: PrismaBudgetRepository },
    CreateBudgetUseCase,
    FindAllBudgetsUseCase,
    FindBudgetByIdUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase
  ]
})
export class BudgetModule {}
