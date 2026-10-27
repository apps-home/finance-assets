import { Module } from '@nestjs/common'

import { BenchmarkDataModule } from '@/infra/http/external/benchmark/benchmark-data.module'

import { AssetModule } from '../assets/asset/asset.module'
import { CategoryModule } from '../assets/categories/category.module'
import { BudgetModule } from '../budgets/budget.module'
import { DividendModule } from '../dividends/dividend.module'
import { TransactionModule } from '../transactions/transaction.module'
import { SyncBenchmarksCron } from './adapters/schedules/sync-benchmarks.cron'
import { GetAssetTotalReturnsUseCase } from './application/use-cases/get-asset-total-returns'
import { GetPortfolioPerformanceUseCase } from './application/use-cases/get-portfolio-performance'
import { SyncBenchmarksUseCase } from './application/use-cases/sync-benchmarks'
import { BenchmarkReturnRepository } from './domain/benchmark-return.repository'
import { PerformanceController } from './infra/performance.controller'
import { PrismaBenchmarkReturnRepository } from './infra/repositories/prisma.benchmark-return.repository'

@Module({
  imports: [
    AssetModule,
    BudgetModule,
    CategoryModule,
    DividendModule,
    TransactionModule,
    BenchmarkDataModule
  ],
  controllers: [PerformanceController],
  providers: [
    {
      provide: BenchmarkReturnRepository,
      useClass: PrismaBenchmarkReturnRepository
    },
    GetAssetTotalReturnsUseCase,
    GetPortfolioPerformanceUseCase,
    SyncBenchmarksUseCase,
    SyncBenchmarksCron
  ]
})
export class PerformanceModule {}
