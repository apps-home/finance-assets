import { Module } from '@nestjs/common'

import { PriceHistoryModule } from '@/infra/http/external/market-data/price-history.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'
import { MarketAssetModule } from '@/modules/assets/market-asset/market-asset.module'
import { WishlistModule } from '@/modules/assets/wishlist/wishlist.module'
import { BudgetModule } from '@/modules/budgets/budget.module'

import { NotifyAssetVariationsCron } from './adapters/schedules/notify-asset-variations.cron'
import { CreateAssetUseCase } from './application/use-cases/create-asset'
import { DeleteAssetUseCase } from './application/use-cases/delete-asset'
import { FindAssetByIdUseCase } from './application/use-cases/find-asset-by-id'
import { FindAssetsUseCase } from './application/use-cases/find-assets'
import { GetAssetPriceHistoryUseCase } from './application/use-cases/get-asset-price-history'
import { GetPortfolioSummaryUseCase } from './application/use-cases/get-portfolio-summary'
import { NotifyAssetVariationsUseCase } from './application/use-cases/notify-asset-variations'
import { UpdateAssetUseCase } from './application/use-cases/update-asset'
import { AssetRepository } from './domain/asset.repository'
import { AssetController } from './infra/asset.controller'
import { PrismaAssetRepository } from './infra/repositories/prisma.asset.repository'

@Module({
  imports: [
    CategoryModule,
    MarketAssetModule,
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
    NotifyAssetVariationsCron,
    NotifyAssetVariationsUseCase
  ],
  exports: [AssetRepository]
})
export class AssetModule {}
