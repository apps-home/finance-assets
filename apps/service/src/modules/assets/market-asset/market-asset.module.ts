import { Module } from '@nestjs/common'

import { MarketDataModule } from '@/infra/http/external/market-data/market-data.module'

import { MarketQuoteRequestedListener } from './adapters/events/market-quote-requested.listener'
import { UpdateMarketPriceProcessor } from './adapters/jobs/update-price.consumer'
import { UpdateMarketPricesCron } from './adapters/schedules/update-market-prices.cron'
import { RefreshMarketAssetQuoteUseCase } from './application/use-cases/refresh-market-asset-quote'
import { ResolveMarketAssetUseCase } from './application/use-cases/resolve-market-asset'
import { ResolveMarketAssetWithQuoteUseCase } from './application/use-cases/resolve-market-asset-with-quote'
import { MarketAssetRepository } from './domain/market-asset.repository'
import { PrismaMarketAssetRepository } from './infra/repositories/prisma.market-asset.repository'

@Module({
  imports: [MarketDataModule],
  providers: [
    { provide: MarketAssetRepository, useClass: PrismaMarketAssetRepository },
    ResolveMarketAssetUseCase,
    ResolveMarketAssetWithQuoteUseCase,
    RefreshMarketAssetQuoteUseCase,
    MarketQuoteRequestedListener,
    UpdateMarketPriceProcessor,
    UpdateMarketPricesCron
  ],
  exports: [
    ResolveMarketAssetUseCase,
    ResolveMarketAssetWithQuoteUseCase,
    RefreshMarketAssetQuoteUseCase
  ]
})
export class MarketAssetModule {}
