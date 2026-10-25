import { Module } from '@nestjs/common'

import { InfraModule } from './infra/infra.module'
import { AssetModule } from './modules/assets/asset/asset.module'
import { CategoryModule } from './modules/assets/categories/category.module'
import { CompetenceModule } from './modules/assets/competences/competence.module'
import { WishlistModule } from './modules/assets/wishlist/wishlist.module'
import { BudgetModule } from './modules/budgets/budget.module'
import { DividendModule } from './modules/dividends/dividend.module'
import { UserModule } from './modules/user/user.module'

@Module({
  imports: [
    InfraModule,
    CategoryModule,
    BudgetModule,
    CompetenceModule,
    AssetModule,
    UserModule,
    WishlistModule,
    DividendModule
  ]
})
export class AppModule {}
