import { CategoryType } from '@/features/categories/api/types'

export const CATEGORY_TYPE_COLORS: Record<CategoryType, string> = {
  [CategoryType.FIXED]:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  [CategoryType.VARIABLE_US]:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  [CategoryType.CRYPTO]: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

export const CATEGORY_TYPE_BG: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'bg-emerald-500',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500',
  [CategoryType.VARIABLE_US]: 'bg-violet-500',
  [CategoryType.CRYPTO]: 'bg-amber-500'
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Renda Fixa',
  [CategoryType.VARIABLE_BR]: 'Ações Nacionais',
  [CategoryType.VARIABLE_US]: 'Ações Internacionais',
  [CategoryType.CRYPTO]: 'Criptomoedas'
}

export const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£'
}
