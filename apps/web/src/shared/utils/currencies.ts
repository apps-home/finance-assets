import { CategoryType } from '@/features/categories/api/types'

export const CURRENCIES: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'BRL',
  [CategoryType.VARIABLE_BR]: 'BRL',
  [CategoryType.VARIABLE_US]: 'USD',
  [CategoryType.CRYPTO]: 'BRL'
}
