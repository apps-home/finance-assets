import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export type PerformanceScope = 'all' | 'variable' | 'fixed'

export const PERFORMANCE_SCOPES: PerformanceScope[] = [
  'all',
  'variable',
  'fixed'
]

/** Tipos de categoria que entram em cada escopo (`undefined` = todos) */
const SCOPE_TYPES: Record<PerformanceScope, CategoryType[] | undefined> = {
  all: undefined,
  variable: [
    CategoryType.VARIABLE_BR,
    CategoryType.FII,
    CategoryType.VARIABLE_US,
    CategoryType.CRYPTO
  ],
  fixed: [CategoryType.FIXED]
}

export function isCategoryInScope(
  type: CategoryType,
  scope: PerformanceScope
): boolean {
  const types = SCOPE_TYPES[scope]

  return types === undefined || types.includes(type)
}
