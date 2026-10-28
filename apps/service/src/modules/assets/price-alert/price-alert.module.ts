import { Module } from '@nestjs/common'

import { AssetModule } from '@/modules/assets/asset/asset.module'
import { WishlistModule } from '@/modules/assets/wishlist/wishlist.module'

import { MarketQuoteUpdatedListener } from './adapters/events/market-quote-updated.listener'
import { CreatePriceAlertUseCase } from './application/use-cases/create-price-alert'
import { DeletePriceAlertUseCase } from './application/use-cases/delete-price-alert'
import { EvaluatePriceAlertsUseCase } from './application/use-cases/evaluate-price-alerts'
import { ListPriceAlertsUseCase } from './application/use-cases/list-price-alerts'
import { PriceAlertRepository } from './domain/price-alert.repository'
import { PriceAlertController } from './infra/price-alert.controller'
import { PrismaPriceAlertRepository } from './infra/repositories/prisma.price-alert.repository'

@Module({
  imports: [AssetModule, WishlistModule],
  controllers: [PriceAlertController],
  providers: [
    { provide: PriceAlertRepository, useClass: PrismaPriceAlertRepository },
    CreatePriceAlertUseCase,
    ListPriceAlertsUseCase,
    DeletePriceAlertUseCase,
    EvaluatePriceAlertsUseCase,
    MarketQuoteUpdatedListener
  ]
})
export class PriceAlertModule {}
