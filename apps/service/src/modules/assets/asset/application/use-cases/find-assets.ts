import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import {
  calcMonthChange,
  sortByMonthChange
} from '@/core/utils/sort-by-month-change'
import { CATEGORY_TYPE_ORDER } from '@/modules/assets/categories/domain/category.entity'

import { AssetHTTPResponse, AssetMapper } from '../../domain/asset.mapper'
import {
  AssetRepository,
  AssetWithCategory
} from '../../domain/asset.repository'
import { FindAssetsParams } from '../../domain/dto/find-assets-params.dto'

export interface AssetWithCategoryHTTPResponse extends AssetHTTPResponse {
  category: AssetWithCategory['category']
}

type FindAssetsResponse = Either<Error, AssetWithCategoryHTTPResponse[]>

@Injectable()
export class FindAssetsUseCase {
  constructor(private assetRepository: AssetRepository) {}

  async execute(params: FindAssetsParams): Promise<FindAssetsResponse> {
    const items = await this.assetRepository.list(params)

    const assets = items.map(
      ({ asset, category }): AssetWithCategoryHTTPResponse => ({
        ...AssetMapper.toHTTP(asset),
        category
      })
    )

    if (params.sort === 'monthChange') {
      return right(
        sortByMonthChange(
          assets,
          (asset) =>
            calcMonthChange(asset.currentClosePrice, asset.lastMonthClosePrice),
          params.order
        )
      )
    }

    return right(
      assets.sort(
        (a, b) =>
          CATEGORY_TYPE_ORDER[a.category.type] -
          CATEGORY_TYPE_ORDER[b.category.type]
      )
    )
  }
}
