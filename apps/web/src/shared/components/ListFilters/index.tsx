'use client'

import { LayoutGrid, RotateCcw, Search, Table as TableIcon } from 'lucide-react'

import {
  type FilterOption,
  FilterSelect
} from '@/shared/components/FilterSelect'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { MONTH_SORT_OPTIONS, type MonthSort } from '@/shared/utils/month-sort'

export type ViewMode = 'table' | 'cards'

interface ListFiltersProps {
  searchPlaceholder: string
  search: string
  onSearchChange: (value: string) => void
  categories: { id: string; name: string }[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  typeOptions: FilterOption[]
  selectedType: string
  onTypeChange: (value: string) => void
  extraFilter: {
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
  }
  selectedSort: MonthSort
  onSortChange: (value: MonthSort) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onReset: () => void
  className?: string
}

const VIEW_MODES = [
  { mode: 'table', label: 'Visualização em Tabela', icon: TableIcon },
  { mode: 'cards', label: 'Visualização em Cards', icon: LayoutGrid }
] as const

export function ListFilters({
  searchPlaceholder,
  search,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  typeOptions,
  selectedType,
  onTypeChange,
  extraFilter,
  selectedSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onReset,
  className
}: ListFiltersProps) {
  const hasActiveFilters =
    search !== '' ||
    selectedCategory !== 'ALL' ||
    selectedType !== 'ALL' ||
    extraFilter.value !== 'ALL' ||
    selectedSort !== 'DEFAULT'

  return (
    <div
      data-slot="list-filters"
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative min-w-50 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        <FilterSelect
          className="min-w-45"
          value={selectedCategory}
          onChange={onCategoryChange}
          options={[
            { value: 'ALL', label: 'Todas as Categorias' },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name }))
          ]}
        />

        <FilterSelect
          className="min-w-37.5"
          value={selectedType}
          onChange={onTypeChange}
          options={[{ value: 'ALL', label: 'Todos os Tipos' }, ...typeOptions]}
        />

        <FilterSelect
          className="min-w-45"
          value={extraFilter.value}
          onChange={extraFilter.onChange}
          options={extraFilter.options}
        />

        <FilterSelect
          className="min-w-50"
          value={selectedSort}
          onChange={(value) => onSortChange(value as MonthSort)}
          options={MONTH_SORT_OPTIONS}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 gap-1.5 px-2.5 text-muted-foreground text-xs hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 self-end rounded-lg border border-border bg-muted/20 p-0.5 lg:self-auto">
        {VIEW_MODES.map(({ mode, label, icon: Icon }) => (
          <Tooltip key={mode}>
            <TooltipTrigger
              render={
                <Button
                  variant={viewMode === mode ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8"
                  onClick={() => onViewModeChange(mode)}
                >
                  <Icon className="size-4" />
                </Button>
              }
            />
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
