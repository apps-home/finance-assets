import { Module } from '@nestjs/common'

import { DividendDataModule } from '@/infra/http/external/market-data/dividend-data.module'
import { AssetModule } from '@/modules/assets/asset/asset.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'
import { BudgetModule } from '@/modules/budgets/budget.module'

import { SyncDividendsProcessor } from './adapters/jobs/sync-dividends.consumer'
import { SyncDividendsCron } from './adapters/schedules/sync-dividends.cron'
import { BackfillDividendsUseCase } from './application/use-cases/backfill-dividends'
import { CreateDividendUseCase } from './application/use-cases/create-dividend'
import { DeleteDividendUseCase } from './application/use-cases/delete-dividend'
import { FindAllDividendsUseCase } from './application/use-cases/find-all-dividends'
import { FindDividendByIdUseCase } from './application/use-cases/find-dividend-by-id'
import { GetDividendsSummaryUseCase } from './application/use-cases/get-dividends-summary'
import { GetUpcomingDividendsUseCase } from './application/use-cases/get-upcoming-dividends'
import { SyncAssetDividendsUseCase } from './application/use-cases/sync-asset-dividends'
import { UpdateDividendUseCase } from './application/use-cases/update-dividend'
import { DividendRepository } from './domain/dividend.repository'
import { DividendController } from './infra/dividend.controller'
import { PrismaDividendRepository } from './infra/repositories/prisma.dividend.repository'

@Module({
  imports: [AssetModule, CategoryModule, BudgetModule, DividendDataModule],
  controllers: [DividendController],
  providers: [
    { provide: DividendRepository, useClass: PrismaDividendRepository },
    BackfillDividendsUseCase,
    CreateDividendUseCase,
    FindAllDividendsUseCase,
    FindDividendByIdUseCase,
    UpdateDividendUseCase,
    DeleteDividendUseCase,
    GetDividendsSummaryUseCase,
    GetUpcomingDividendsUseCase,
    SyncAssetDividendsUseCase,
    SyncDividendsCron,
    SyncDividendsProcessor
  ],
  exports: [DividendRepository]
})
export class DividendModule {}
