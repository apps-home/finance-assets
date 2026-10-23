import { useQueryState } from 'nuqs'

import type { ViewMode } from '@/shared/components/ListFilters'
import { parseMonthSort, toSortParams } from '@/shared/utils/month-sort'

import { useDebouncedValue } from './use-debounced-value'

export function useListFilters(extraFilterKey: string) {
  const [search, setSearch] = useQueryState('search', { defaultValue: '' })
  const [categoryFilter, setCategoryFilter] = useQueryState('category', {
    defaultValue: 'ALL'
  })
  const [typeFilter, setTypeFilter] = useQueryState('type', {
    defaultValue: 'ALL'
  })
  const [extraFilter, setExtraFilter] = useQueryState(extraFilterKey, {
    defaultValue: 'ALL'
  })
  const [sortBy, setSortBy] = useQueryState('sort', {
    defaultValue: 'DEFAULT'
  })
  const [viewMode, setViewMode] = useQueryState<ViewMode>('view', {
    defaultValue: 'table',
    parse: (value): ViewMode => (value === 'cards' ? 'cards' : 'table')
  })

  const debouncedSearch = useDebouncedValue(search.trim())
  const sort = parseMonthSort(sortBy)

  function resetFilters() {
    setSearch('')
    setCategoryFilter('ALL')
    setTypeFilter('ALL')
    setExtraFilter('ALL')
    setSortBy('DEFAULT')
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    categoryFilter,
    setCategoryFilter,
    typeFilter,
    setTypeFilter,
    extraFilter,
    setExtraFilter,
    sort,
    setSort: setSortBy,
    sortParams: toSortParams(sort),
    viewMode,
    setViewMode,
    resetFilters
  }
}
