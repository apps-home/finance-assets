import { Injectable } from '@nestjs/common'

import { DividendDataGateway } from '@/core/http/external/market-data/dividend-data.gateway'
import { DividendDataProvider } from '@/core/http/external/market-data/dividend-data.provider'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { BrapiDividendDataProvider } from './brapi/brapi-dividend-data.provider'
import { PolygonDividendDataProvider } from './polygon/polygon-dividend-data.provider'

@Injectable()
export class DividendDataFactory implements DividendDataGateway {
  constructor(
    private readonly brapiProvider: BrapiDividendDataProvider,
    private readonly polygonProvider: PolygonDividendDataProvider
  ) {}

  getProvider(categoryType: CategoryType): DividendDataProvider | null {
    switch (categoryType) {
      case CategoryType.VARIABLE_BR:
      case CategoryType.FII:
        return this.brapiProvider

      case CategoryType.VARIABLE_US:
        return this.polygonProvider

      default:
        return null
    }
  }
}
