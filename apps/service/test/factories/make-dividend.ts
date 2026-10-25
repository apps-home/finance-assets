import { faker } from '@faker-js/faker'

import {
  Dividend,
  type DividendProps
} from '@/modules/dividends/domain/dividend.entity'

export function makeDividend(
  override: Partial<DividendProps> & Pick<DividendProps, 'userId' | 'assetId'>
): Dividend {
  return Dividend.create({
    amount: faker.number.float({ min: 1, max: 500, fractionDigits: 2 }),
    paymentDate: faker.date.past(),
    ...override
  })
}
