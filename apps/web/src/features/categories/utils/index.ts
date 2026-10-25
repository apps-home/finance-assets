import { CategoryType } from '@/features/categories/api/types'

export const CATEGORY_TYPE_COLORS: Record<CategoryType, string> = {
  [CategoryType.FIXED]:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  [CategoryType.FII]: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  [CategoryType.VARIABLE_US]:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  [CategoryType.CRYPTO]: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

export const CATEGORY_TYPE_BG: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'bg-emerald-500',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500',
  [CategoryType.FII]: 'bg-cyan-500',
  [CategoryType.VARIABLE_US]: 'bg-violet-500',
  [CategoryType.CRYPTO]: 'bg-amber-500'
}

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Renda Fixa',
  [CategoryType.VARIABLE_BR]: 'Ações Nacionais',
  [CategoryType.FII]: 'Fundos Imobiliários',
  [CategoryType.VARIABLE_US]: 'Ações Internacionais',
  [CategoryType.CRYPTO]: 'Criptomoedas'
}

export const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£'
}

export const CATEGORY_TYPE_OPTIONS = [
  CategoryType.FIXED,
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US,
  CategoryType.CRYPTO
].map((type) => ({ value: type, label: CATEGORY_TYPE_LABELS[type] }))

export const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'Real Brasileiro (R$)' },
  { value: 'USD', label: 'Dólar Americano ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Libra Esterlina (£)' }
]

const DEFAULT_CURRENCY_BY_TYPE: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'BRL',
  [CategoryType.VARIABLE_BR]: 'BRL',
  [CategoryType.FII]: 'BRL',
  [CategoryType.VARIABLE_US]: 'USD',
  [CategoryType.CRYPTO]: 'BRL'
}

export function getCategoryCurrency(
  category?: { currency?: string; type?: CategoryType } | null
) {
  return (
    category?.currency ||
    DEFAULT_CURRENCY_BY_TYPE[category?.type ?? CategoryType.FIXED]
  )
}
