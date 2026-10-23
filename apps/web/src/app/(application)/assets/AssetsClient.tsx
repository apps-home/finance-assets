'use client'

import { Briefcase, FilterX, PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  AssetWithCategory,
  CreateAssetDTO,
  ListAssetsParams
} from '@/features/assets/api/types'
import { AssetCard } from '@/features/assets/components/AssetCard'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { AssetSummaryCards } from '@/features/assets/components/AssetSummaryCards'
import { AssetTable } from '@/features/assets/components/AssetTable'
import {
  useAssets,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset
} from '@/features/assets/hooks/use-assets'
import { CategoryType } from '@/features/categories/api/types'
import { useCategories } from '@/features/categories/hooks/use-category'
import { CATEGORY_TYPE_OPTIONS } from '@/features/categories/utils'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { DollarRateBadge } from '@/shared/components/DollarRateBadge'
import { ListFilters } from '@/shared/components/ListFilters'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useListFilters } from '@/shared/hooks/use-list-filters'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos os Status' },
  { value: 'ACTIVE', label: 'Em Carteira' },
  { value: 'INACTIVE', label: 'Inativos' }
]

export default function AssetsClient() {
  const filters = useListFilters('status')

  const [formOpen, setFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetWithCategory | null>(
    null
  )
  const [deletingAsset, setDeletingAsset] = useState<AssetWithCategory | null>(
    null
  )

  const params = useMemo<ListAssetsParams>(
    () => ({
      search: filters.debouncedSearch || undefined,
      categoryId:
        filters.categoryFilter !== 'ALL' ? filters.categoryFilter : undefined,
      type:
        filters.typeFilter !== 'ALL'
          ? (filters.typeFilter as CategoryType)
          : undefined,
      status:
        filters.extraFilter === 'ACTIVE' || filters.extraFilter === 'INACTIVE'
          ? filters.extraFilter
          : undefined,
      ...filters.sortParams
    }),
    [
      filters.debouncedSearch,
      filters.categoryFilter,
      filters.typeFilter,
      filters.extraFilter,
      filters.sortParams
    ]
  )

  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories()
  const { data: assets = [], isLoading: isLoadingAssets } = useAssets(params)
  const { mutateAsync: createAsset, isPending: isCreating } = useCreateAsset()
  const { mutateAsync: updateAsset, isPending: isUpdating } = useUpdateAsset()
  const { mutateAsync: deleteAsset, isPending: isDeleting } = useDeleteAsset()
  const isLoading = isLoadingCategories || isLoadingAssets

  const handleOpenCreate = () => {
    setEditingAsset(null)
    setFormOpen(true)
  }

  const handleEdit = (asset: AssetWithCategory) => {
    setEditingAsset(asset)
    setFormOpen(true)
  }

  const handleDelete = (asset: AssetWithCategory) => {
    setDeletingAsset(asset)
  }

  const handleSubmitForm = async (dto: CreateAssetDTO) => {
    const { categoryId, ...fields } = dto

    if (editingAsset) {
      await updateAsset({ id: editingAsset.id, dto: fields })
      setEditingAsset(null)
    } else {
      await createAsset({ categoryId, ...fields })
    }

    setFormOpen(false)
  }

  if (isLoading) {
    return (
      <div className="bg-background px-4 pt-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-screen-2xl space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const hasActiveFilters = Object.entries(params).some(
    ([, value]) => value !== undefined
  )
  const hasAnyAsset = assets.length > 0 || hasActiveFilters

  return (
    <div
      data-slot="assets-page"
      className="bg-background px-4 pt-4 pb-12 sm:px-6"
    >
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Briefcase className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Ativos
              </h1>
              <p className="text-muted-foreground text-xs">
                Gerencie e acompanhe todos os ativos da sua carteira de
                investimentos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <DollarRateBadge />
            <Button onClick={handleOpenCreate} className="gap-2">
              <PlusIcon className="size-4" />
              Novo Ativo
            </Button>
          </div>
        </div>

        <AssetSummaryCards assets={assets} />

        <ListFilters
          searchPlaceholder="Buscar por ticker, nome ou corretora..."
          search={filters.search}
          onSearchChange={filters.setSearch}
          categories={categories}
          selectedCategory={filters.categoryFilter}
          onCategoryChange={filters.setCategoryFilter}
          typeOptions={CATEGORY_TYPE_OPTIONS}
          selectedType={filters.typeFilter}
          onTypeChange={filters.setTypeFilter}
          extraFilter={{
            value: filters.extraFilter,
            onChange: filters.setExtraFilter,
            options: STATUS_OPTIONS
          }}
          selectedSort={filters.sort}
          onSortChange={filters.setSort}
          viewMode={filters.viewMode}
          onViewModeChange={filters.setViewMode}
          onReset={filters.resetFilters}
        />

        {assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border border-dashed py-16 text-center">
            <div className="mb-4 rounded-xl bg-muted/50 p-4">
              {hasAnyAsset ? (
                <FilterX className="size-10 text-muted-foreground/60" />
              ) : (
                <Briefcase className="size-10 text-muted-foreground/60" />
              )}
            </div>
            <h3 className="mb-1.5 font-semibold text-base text-foreground">
              {hasAnyAsset
                ? 'Nenhum ativo encontrado para os filtros selecionados'
                : 'Nenhum ativo cadastrado'}
            </h3>
            <p className="max-w-sm text-muted-foreground text-xs">
              {hasAnyAsset
                ? 'Tente ajustar ou limpar os filtros para visualizar outros ativos.'
                : 'Você ainda não possui ativos cadastrados. Cadastre seu primeiro ativo para acompanhar sua carteira.'}
            </p>

            {hasAnyAsset ? (
              <Button
                variant="outline"
                size="sm"
                onClick={filters.resetFilters}
                className="mt-4 text-xs"
              >
                Limpar filtros
              </Button>
            ) : (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="mt-4 gap-2 text-xs"
              >
                <PlusIcon className="size-3.5" />
                Cadastrar primeiro ativo
              </Button>
            )}
          </div>
        ) : filters.viewMode === 'table' ? (
          <AssetTable
            assets={assets}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingAsset(null)
        }}
        onSubmit={handleSubmitForm}
        isPending={isCreating || isUpdating}
        categories={categories}
        initialCategoryId={
          filters.categoryFilter !== 'ALL' ? filters.categoryFilter : undefined
        }
        defaultValues={
          editingAsset
            ? {
                name: editingAsset.name,
                ticker: editingAsset.ticker || '',
                categoryId: editingAsset.categoryId,
                quantity: editingAsset.quantity,
                averagePrice: editingAsset.averagePrice,
                currentClosePrice: editingAsset.currentClosePrice,
                broker: editingAsset.broker || '',
                isActive: editingAsset.isActive
              }
            : undefined
        }
      />

      <ConfirmDeleteDialog
        open={!!deletingAsset}
        onOpenChange={(open) => {
          if (!open) setDeletingAsset(null)
        }}
        title="Remover Ativo"
        itemName={deletingAsset?.name || ''}
        onConfirm={async () => {
          if (deletingAsset) {
            await deleteAsset(deletingAsset.id)
            setDeletingAsset(null)
          }
        }}
        isPending={isDeleting}
      />
    </div>
  )
}
