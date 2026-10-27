import { Module } from '@nestjs/common'

import { AssetModule } from '@/modules/assets/asset/asset.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'

import { CreateTransactionUseCase } from './application/use-cases/create-transaction'
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction'
import { FindAllTransactionsUseCase } from './application/use-cases/find-all-transactions'
import { GetMonthlyContributionsUseCase } from './application/use-cases/get-monthly-contributions'
import { UpdateTransactionUseCase } from './application/use-cases/update-transaction'
import { TransactionRepository } from './domain/transaction.repository'
import { PrismaTransactionRepository } from './infra/repositories/prisma.transaction.repository'
import { TransactionController } from './infra/transaction.controller'

@Module({
  imports: [AssetModule, CategoryModule],
  controllers: [TransactionController],
  providers: [
    { provide: TransactionRepository, useClass: PrismaTransactionRepository },
    CreateTransactionUseCase,
    FindAllTransactionsUseCase,
    UpdateTransactionUseCase,
    DeleteTransactionUseCase,
    GetMonthlyContributionsUseCase
  ],
  exports: [TransactionRepository]
})
export class TransactionModule {}
