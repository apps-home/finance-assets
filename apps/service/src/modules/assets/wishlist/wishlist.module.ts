import { Module } from '@nestjs/common'

import { MarketDataModule } from '@/infra/http/external/market-data/market-data.module'
import { CategoryModule } from '@/modules/assets/categories/category.module'

import { CreateWishlistUseCase } from './application/use-cases/create-wishlist'
import { DeleteWishlistUseCase } from './application/use-cases/delete-wishlist'
import { FindAllWishlistUseCase } from './application/use-cases/find-all-wishlist'
import { FindWishlistByIdUseCase } from './application/use-cases/find-wishlist-by-id'
import { UpdateWishlistUseCase } from './application/use-cases/update-wishlist'
import { WishlistRepository } from './domain/wishlist.repository'
import { PrismaWishlistRepository } from './infra/repositories/prisma.wishlist.repository'
import { WishlistController } from './infra/wishlist.controller'

@Module({
  imports: [CategoryModule, MarketDataModule],
  controllers: [WishlistController],
  providers: [
    { provide: WishlistRepository, useClass: PrismaWishlistRepository },
    CreateWishlistUseCase,
    FindAllWishlistUseCase,
    FindWishlistByIdUseCase,
    UpdateWishlistUseCase,
    DeleteWishlistUseCase
  ],
  exports: [WishlistRepository]
})
export class WishlistModule {}
