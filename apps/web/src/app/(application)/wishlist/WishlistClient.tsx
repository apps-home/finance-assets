'use client'

import { Bookmark, FilterX, PlusIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { CreateAssetDTO } from '@/features/assets/api/types'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { useCreateAsset } from '@/features/assets/hooks/use-assets'
import type { CategoryType } from '@/features/categories/api/types'
import { useCategories } from '@/features/categories/hooks/use-category'
import { CATEGORY_TYPE_OPTIONS } from '@/features/categories/utils'
import type {
  CreateWishlistDTO,
  TargetPriceStatus,
  WishlistSearchParams,
  WishlistWithCategory
} from '@/features/wishlist/api/types'
import { WishlistCard } from '@/features/wishlist/components/WishlistCard'
import { WishlistDetailSheet } from '@/features/wishlist/components/WishlistDetailSheet'
import { WishlistForm } from '@/features/wishlist/components/WishlistForm'
import { WishlistSummaryCards } from '@/features/wishlist/components/WishlistSummaryCards'
import { WishlistTable } from '@/features/wishlist/components/WishlistTable'
import {
  useCreateWishlistItem,
  useDeleteWishlistItem,
  useUpdateWishlistItem,
  useWishlist
} from '@/features/wishlist/hooks/use-wishlist'
import { TARGET_STATUS_OPTIONS } from '@/features/wishlist/utils/target-price'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { DollarRateBadge } from '@/shared/components/DollarRateBadge'
import { ListFilters } from '@/shared/components/ListFilters'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useListFilters } from '@/shared/hooks/use-list-filters'

export default function WishlistClient() {
  const filters = useListFilters('targetStatus')

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistWithCategory | null>(
    null
  )
  const [viewingItem, setViewingItem] = useState<WishlistWithCategory | null>(
    null
  )
  const [addingToPortfolio, setAddingToPortfolio] =
    useState<WishlistWithCategory | null>(null)
  const [deletingItem, setDeletingItem] = useState<WishlistWithCategory | null>(
    null
  )

  const params = useMemo<WishlistSearchParams>(
    () => ({
      search: filters.debouncedSearch || undefined,
      categoryId:
        filters.categoryFilter !== 'ALL' ? filters.categoryFilter : undefined,
      type:
        filters.typeFilter !== 'ALL'
          ? (filters.typeFilter as CategoryType)
          : undefined,
      targetStatus:
        filters.extraFilter !== 'ALL'
          ? (filters.extraFilter as TargetPriceStatus)
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

  const { data: filteredItems = [], isLoading } = useWishlist(params)
  const { mutateAsync: createWishlist, isPending: isCreating } =
    useCreateWishlistItem()
  const { mutateAsync: updateWishlist, isPending: isUpdating } =
    useUpdateWishlistItem()
  const { mutateAsync: deleteWishlist, isPending: isDeleting } =
    useDeleteWishlistItem()

  const { mutateAsync: createAsset, isPending: isCreatingAsset } =
    useCreateAsset()

  // Estável entre renders: o diálogo reinicia o formulário quando isso muda
  const portfolioDefaults = useMemo(
    () =>
      addingToPortfolio
        ? {
            name: addingToPortfolio.wishlist.name,
            ticker: addingToPortfolio.wishlist.ticker,
            categoryId: addingToPortfolio.wishlist.categoryId,
            quantity: null,
            averagePrice: null,
            broker: '',
            isActive: true
          }
        : undefined,
    [addingToPortfolio]
  )

  const { data: categories = [] } = useCategories()

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormOpen(true)
  }

  const handleEdit = (item: WishlistWithCategory) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleDelete = (item: WishlistWithCategory) => {
    setDeletingItem(item)
  }

  const handleSubmitForm = async (data: CreateWishlistDTO) => {
    if (editingItem) {
      await updateWishlist({
        id: editingItem.wishlist.id,
        dto: {
          name: data.name,
          ticker: data.ticker,
          targetPrice: data.targetPrice,
          notes: data.notes
        }
      })
      setEditingItem(null)
      setFormOpen(false)
    } else {
      await createWishlist(data)
      setFormOpen(false)
    }
  }

  // A cotação vem do catálogo compartilhado: o ticker da wishlist é reaproveitado
  const handleAddToPortfolio = async (dto: CreateAssetDTO) => {
    await createAsset(dto)
    setAddingToPortfolio(null)
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

  const hasActiveFilters = Object.values(params).some(
    (value) => value !== undefined
  )
  const hasAnyItem = filteredItems.length > 0 || hasActiveFilters

  return (
    <div
      data-slot="wishlist-page"
      className="bg-background px-4 pt-4 pb-12 sm:px-6"
    >
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Bookmark className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Lista de Desejos
              </h1>
              <p className="text-muted-foreground text-xs">
                Acompanhe ativos de interesse e monitore oportunidades de compra
                pelo preço alvo
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

        <WishlistSummaryCards items={filteredItems} />

        <ListFilters
          searchPlaceholder="Buscar por ticker, nome ou notas..."
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
            options: TARGET_STATUS_OPTIONS
          }}
          selectedSort={filters.sort}
          onSortChange={filters.setSort}
          viewMode={filters.viewMode}
          onViewModeChange={filters.setViewMode}
          onReset={filters.resetFilters}
        />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border border-dashed py-16 text-center">
            <div className="mb-4 rounded-xl bg-muted/50 p-4">
              {hasAnyItem ? (
                <FilterX className="size-10 text-muted-foreground/60" />
              ) : (
                <Bookmark className="size-10 text-muted-foreground/60" />
              )}
            </div>
            <h3 className="mb-1.5 font-semibold text-base text-foreground">
              {hasAnyItem
                ? 'Nenhum ativo encontrado para os filtros selecionados'
                : 'Sua Wishlist está vazia'}
            </h3>
            <p className="max-w-sm text-muted-foreground text-xs">
              {hasAnyItem
                ? 'Tente ajustar ou limpar os filtros para visualizar outros ativos em monitoramento.'
                : 'Adicione ações, FIIs ou criptomoedas que você gostaria de comprar para receber cotações diárias e definir preços alvo.'}
            </p>

            {hasAnyItem ? (
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
                Adicionar primeiro ativo
              </Button>
            )}
          </div>
        ) : filters.viewMode === 'table' ? (
          <WishlistTable
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={setViewingItem}
            onAddToPortfolio={setAddingToPortfolio}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <WishlistCard
                key={item.wishlist.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={setViewingItem}
                onAddToPortfolio={setAddingToPortfolio}
              />
            ))}
          </div>
        )}
      </div>

      <WishlistDetailSheet
        item={viewingItem}
        open={!!viewingItem}
        onOpenChange={(open) => {
          if (!open) setViewingItem(null)
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddToPortfolio={setAddingToPortfolio}
      />

      <AssetFormDialog
        mode="create"
        open={!!addingToPortfolio}
        onOpenChange={(open) => {
          if (!open) setAddingToPortfolio(null)
        }}
        onSubmit={handleAddToPortfolio}
        isPending={isCreatingAsset}
        categories={categories}
        defaultValues={portfolioDefaults}
      />

      <WishlistForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        onSubmit={handleSubmitForm}
        isPending={isCreating || isUpdating}
        categories={categories}
        initialCategoryId={
          filters.categoryFilter !== 'ALL' ? filters.categoryFilter : undefined
        }
        editingItem={editingItem}
      />

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null)
        }}
        title="Remover da Wishlist"
        itemName={deletingItem?.wishlist.name || ''}
        trailing=" da sua lista de desejos?"
        onConfirm={async () => {
          if (deletingItem) {
            await deleteWishlist(deletingItem.wishlist.id)
            setDeletingItem(null)
          }
        }}
        isPending={isDeleting}
      />
    </div>
  )
}
