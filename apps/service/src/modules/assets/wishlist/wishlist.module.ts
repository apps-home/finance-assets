import { Module } from '@nestjs/common'

import { PriceHistoryModule } from '@/infra/http/external/market-data/price-history.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'
import { MarketAssetModule } from '@/modules/assets/market-asset/market-asset.module'

import { CreateWishlistUseCase } from './application/use-cases/create-wishlist'
import { DeleteWishlistUseCase } from './application/use-cases/delete-wishlist'
import { FindAllWishlistUseCase } from './application/use-cases/find-all-wishlist'
import { FindWishlistByIdUseCase } from './application/use-cases/find-wishlist-by-id'
import { GetWishlistPriceHistoryUseCase } from './application/use-cases/get-wishlist-price-history'
import { UpdateWishlistUseCase } from './application/use-cases/update-wishlist'
import { WishlistRepository } from './domain/wishlist.repository'
import { PrismaWishlistRepository } from './infra/repositories/prisma.wishlist.repository'
import { WishlistController } from './infra/wishlist.controller'

@Module({
  imports: [CategoryModule, MarketAssetModule, PriceHistoryModule],
  controllers: [WishlistController],
  providers: [
    { provide: WishlistRepository, useClass: PrismaWishlistRepository },
    CreateWishlistUseCase,
    FindAllWishlistUseCase,
    FindWishlistByIdUseCase,
    GetWishlistPriceHistoryUseCase,
    UpdateWishlistUseCase,
    DeleteWishlistUseCase
  ],
  exports: [WishlistRepository]
})
export class WishlistModule {}
