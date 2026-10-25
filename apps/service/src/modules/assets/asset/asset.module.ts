import { Module } from '@nestjs/common'

import { MarketDataModule } from '@/infra/http/external/market-data/market-data.module'
import { PriceHistoryModule } from '@/infra/http/external/market-data/price-history.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'
import { WishlistModule } from '@/modules/assets/wishlist/wishlist.module'
import { BudgetModule } from '@/modules/budgets/budget.module'

import { AssetCreatedListener } from './adapters/events/asset-created.listener'
import { UpdateAssetPriceProcessor } from './adapters/jobs/update-processing.consumer'
import { NotifyAssetVariationsCron } from './adapters/schedules/notify-asset-variations.cron'
import { UpdateAssetPricesCron } from './adapters/schedules/update-asset-prices.cron'
import { CreateAssetUseCase } from './application/use-cases/create-asset'
import { DeleteAssetUseCase } from './application/use-cases/delete-asset'
import { FindAllWithTickerAssetsUseCase } from './application/use-cases/find-all-with-ticker-assets'
import { FindAssetByIdUseCase } from './application/use-cases/find-asset-by-id'
import { FindAssetsUseCase } from './application/use-cases/find-assets'
import { GetAssetPriceHistoryUseCase } from './application/use-cases/get-asset-price-history'
import { GetPortfolioSummaryUseCase } from './application/use-cases/get-portfolio-summary'
import { NotifyAssetVariationsUseCase } from './application/use-cases/notify-asset-variations'
import { UpdateAssetUseCase } from './application/use-cases/update-asset'
import { UpdateAssetPriceUseCase } from './application/use-cases/update-asset-price'
import { AssetRepository } from './domain/asset.repository'
import { AssetController } from './infra/asset.controller'
import { PrismaAssetRepository } from './infra/repositories/prisma.asset.repository'

@Module({
  imports: [
    CategoryModule,
    MarketDataModule,
    PriceHistoryModule,
    WishlistModule,
    BudgetModule
  ],
  controllers: [AssetController],
  providers: [
    { provide: AssetRepository, useClass: PrismaAssetRepository },
    CreateAssetUseCase,
    FindAssetsUseCase,
    GetPortfolioSummaryUseCase,
    GetAssetPriceHistoryUseCase,
    FindAssetByIdUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    FindAllWithTickerAssetsUseCase,
    AssetCreatedListener,
    UpdateAssetPricesCron,
    NotifyAssetVariationsCron,
    UpdateAssetPriceProcessor,
    UpdateAssetPriceUseCase,
    NotifyAssetVariationsUseCase
  ],
  exports: [AssetRepository]
})
export class AssetModule {}
