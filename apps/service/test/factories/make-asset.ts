import { faker } from '@faker-js/faker'

import {
  Asset,
  type AssetProps
} from '@/modules/assets/asset/domain/asset.entity'

export function makeAsset(
  override: Partial<AssetProps> & Pick<AssetProps, 'categoryId'>
): Asset {
  return Asset.create({
    name: faker.finance.accountName(),
    ticker: faker.string.alpha({ length: 4, casing: 'upper' }),
    ...override
  })
}
