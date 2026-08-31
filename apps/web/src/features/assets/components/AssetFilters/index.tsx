'use client'

import { LayoutGrid, RotateCcw, Search, Table as TableIcon } from 'lucide-react'

import { Category, CategoryType } from '@/features/categories/api/types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/utils'

interface AssetFiltersProps {
  categories: Category[]
  search: string
  onSearchChange: (value: string) => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  selectedType: string
  onTypeChange: (value: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
  viewMode: 'table' | 'cards'
  onViewModeChange: (mode: 'table' | 'cards') => void
  onReset: () => void
  className?: string
}

const CATEGORY_TYPES: { value: CategoryType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos os Tipos' },
  { value: CategoryType.FIXED, label: 'Renda Fixa' },
  { value: CategoryType.VARIABLE_BR, label: 'Ações BR' },
  { value: CategoryType.VARIABLE_US, label: 'Ações EUA' },
  { value: CategoryType.CRYPTO, label: 'Cripto' }
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Em Carteira' },
  { value: 'INACTIVE', label: 'Inativos' }
]

export function AssetFilters({
  categories,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  viewMode,
  onViewModeChange,
  onReset,
  className
}: AssetFiltersProps) {
  const hasActiveFilters =
    search !== '' ||
    selectedCategory !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedStatus !== 'ALL'
  const selectedCategoryLabel =
    selectedCategory === 'ALL'
      ? 'Todas as Categorias'
      : (categories.find((category) => category.id === selectedCategory)
          ?.name ?? selectedCategory)
  const selectedTypeLabel =
    CATEGORY_TYPES.find((type) => type.value === selectedType)?.label ??
    selectedType
  const selectedStatusLabel =
    STATUS_OPTIONS.find((status) => status.value === selectedStatus)?.label ??
    selectedStatus

  return (
    <div
      data-slot="asset-filters"
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative min-w-50 flex-1 sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ticker, nome ou corretora..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>

        <div className="w-full min-w-45 sm:w-auto">
          <Select
            value={selectedCategory}
            onValueChange={(v) => v && onCategoryChange(v)}
          >
            <SelectTrigger className="h-9 w-full min-w-45 text-xs">
              <SelectValue>{selectedCategoryLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              <SelectItem value="ALL" className="mx-1 py-2 text-xs">
                Todas as Categorias
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem
                  key={cat.id}
                  value={cat.id}
                  className="mx-1 py-2 text-xs"
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-37.5 sm:w-auto">
          <Select
            value={selectedType}
            onValueChange={(v) => v && onTypeChange(v)}
          >
            <SelectTrigger className="h-9 w-full min-w-37.5 text-xs">
              <SelectValue>{selectedTypeLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              {CATEGORY_TYPES.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  className="mx-1 py-2 text-xs"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full min-w-35 sm:w-auto">
          <Select
            value={selectedStatus}
            onValueChange={(v) => v && onStatusChange(v)}
          >
            <SelectTrigger className="h-9 w-full min-w-35 text-xs">
              <SelectValue>{selectedStatusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full">
              {STATUS_OPTIONS.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="mx-1 py-2 text-xs"
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        <Button
          variant={viewMode === 'table' ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => onViewModeChange('table')}
          title="Visualização em Tabela"
        >
          <TableIcon className="size-4" />
        </Button>
        <Button
          variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
          size="icon"
          className="size-8"
          onClick={() => onViewModeChange('cards')}
          title="Visualização em Cards"
        >
          <LayoutGrid className="size-4" />
        </Button>
      </div>
    </div>
  )
}
