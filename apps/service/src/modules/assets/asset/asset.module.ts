import { Module } from '@nestjs/common'
import { MarketDataModule } from '@/infra/http/external/market-data/market-data.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'
import { AssetCreatedListener } from './adapters/events/asset-created.listener'
import { UpdateAssetPriceProcessor } from './adapters/jobs/update-asset-price.processor'
import { UpdateAssetPricesCron } from './adapters/schedules/update-asset-prices.cron'
import { CreateAssetUseCase } from './application/use-cases/create-asset'
import { DeleteAssetUseCase } from './application/use-cases/delete-asset'
import { FindAllAssetsUseCase } from './application/use-cases/find-all-assets'
import { FindAllWithTickerAssetsUseCase } from './application/use-cases/find-all-with-ticker-assets'
import { FindAssetByIdUseCase } from './application/use-cases/find-asset-by-id'
import { UpdateAssetUseCase } from './application/use-cases/update-asset'
import { UpdateAssetPriceUseCase } from './application/use-cases/update-asset-price'
import { AssetRepository } from './domain/asset.repository'
import { AssetController } from './infra/asset.controller'
import { PrismaAssetRepository } from './infra/repositories/prisma.asset.repository'

@Module({
  imports: [CategoryModule, MarketDataModule],
  controllers: [AssetController],
  providers: [
    { provide: AssetRepository, useClass: PrismaAssetRepository },
    CreateAssetUseCase,
    FindAllAssetsUseCase,
    FindAssetByIdUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    FindAllWithTickerAssetsUseCase,
    AssetCreatedListener,
    UpdateAssetPricesCron,
    UpdateAssetPriceProcessor,
    UpdateAssetPriceUseCase
  ],
  exports: [AssetRepository]
})
export class AssetModule {}
