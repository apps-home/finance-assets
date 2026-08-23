import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { MarketDataProvider } from './market-data.provider'

export abstract class MarketDataGateway {
  abstract getProvider(categoryType: CategoryType): MarketDataProvider | null
}
