import { Injectable } from '@nestjs/common'

import { DividendDataGateway } from '@/core/http/external/market-data/dividend-data.gateway'
import { DividendDataProvider } from '@/core/http/external/market-data/dividend-data.provider'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { PolygonDividendDataProvider } from './polygon/polygon-dividend-data.provider'
import { YahooDividendDataProvider } from './yahoo/yahoo-dividend-data.provider'

@Injectable()
export class DividendDataFactory implements DividendDataGateway {
  constructor(
    private readonly yahooProvider: YahooDividendDataProvider,
    private readonly polygonProvider: PolygonDividendDataProvider
  ) {}

  getProvider(categoryType: CategoryType): DividendDataProvider | null {
    switch (categoryType) {
      case CategoryType.VARIABLE_BR:
      case CategoryType.FII:
        return this.yahooProvider

      case CategoryType.VARIABLE_US:
        return this.polygonProvider

      default:
        return null
    }
  }
}
