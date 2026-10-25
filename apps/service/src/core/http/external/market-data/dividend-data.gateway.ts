import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendDataProvider } from './dividend-data.provider'

export abstract class DividendDataGateway {
  abstract getProvider(categoryType: CategoryType): DividendDataProvider | null
}
