import { Module } from '@nestjs/common'

import { InfraModule } from './infra/infra.module'
import { AssetModule } from './modules/assets/asset/asset.module'
import { CategoryModule } from './modules/assets/categories/category.module'
import { CompetenceModule } from './modules/assets/competences/competence.module'
import { PriceAlertModule } from './modules/assets/price-alert/price-alert.module'
import { WishlistModule } from './modules/assets/wishlist/wishlist.module'
import { BudgetModule } from './modules/budgets/budget.module'
import { DividendModule } from './modules/dividends/dividend.module'
import { PatrimonyItemModule } from './modules/patrimony-items/patrimony-item.module'
import { PerformanceModule } from './modules/performance/performance.module'
import { TransactionModule } from './modules/transactions/transaction.module'
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
    DividendModule,
    PerformanceModule,
    TransactionModule,
    PriceAlertModule,
    PatrimonyItemModule
  ]
})
export class AppModule {}
