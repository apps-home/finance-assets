import { faker } from '@faker-js/faker'

import {
  Category,
  type CategoryProps,
  CategoryType
} from '@/modules/assets/categories/domain/category.entity'

export function makeCategory(override: Partial<CategoryProps> = {}): Category {
  return Category.create({
    name: faker.commerce.department(),
    type: CategoryType.FIXED,
    currency: 'BRL',
    userId: faker.string.uuid(),
    years: [new Date().getFullYear()],
    ...override
  })
}
