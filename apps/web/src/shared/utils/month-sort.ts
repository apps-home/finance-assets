export type MonthSort = 'DEFAULT' | 'MONTH_ASC' | 'MONTH_DESC'

export const MONTH_SORT_OPTIONS: { value: MonthSort; label: string }[] = [
  { value: 'DEFAULT', label: 'Ordem padrão' },
  { value: 'MONTH_ASC', label: 'Mês anterior: maior queda' },
  { value: 'MONTH_DESC', label: 'Mês anterior: maior alta' }
]

export function parseMonthSort(value: string): MonthSort {
  return value === 'MONTH_ASC' || value === 'MONTH_DESC' ? value : 'DEFAULT'
}

export interface SortParams {
  sort?: 'monthChange'
  order?: 'asc' | 'desc'
}

export function toSortParams(sort: MonthSort): SortParams {
  if (sort === 'MONTH_ASC') return { sort: 'monthChange', order: 'asc' }
  if (sort === 'MONTH_DESC') return { sort: 'monthChange', order: 'desc' }
  return {}
}
