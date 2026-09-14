'use client'

import { Bookmark, FilterX, PlusIcon } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import { DollarRateBadge } from '@/features/assets/components/DollarRateBadge'
import { DeleteWishlistDialog } from '@/features/wishlist/components/DeleteWishlistDialog'
import { WishlistCard } from '@/features/wishlist/components/WishlistCard'
import { WishlistFilters } from '@/features/wishlist/components/WishlistFilters'
import { WishlistForm } from '@/features/wishlist/components/WishlistForm'
import { WishlistSummaryCards } from '@/features/wishlist/components/WishlistSummaryCards'
import { WishlistTable } from '@/features/wishlist/components/WishlistTable'
import { useWishlist } from '@/features/wishlist/hooks/useWishlist'
import type {
  CreateWishlistDTO,
  WishlistWithCategory
} from '@/features/wishlist/types/wishlist.types'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

export default function WishlistClient() {
  const [search, setSearch] = useQueryState('search', { defaultValue: '' })
  const [categoryFilter, setCategoryFilter] = useQueryState('category', {
    defaultValue: 'ALL'
  })
  const [typeFilter, setTypeFilter] = useQueryState('type', {
    defaultValue: 'ALL'
  })
  const [targetStatusFilter, setTargetStatusFilter] = useQueryState(
    'targetStatus',
    {
      defaultValue: 'ALL'
    }
  )
  const [viewMode, setViewMode] = useQueryState<'table' | 'cards'>('view', {
    defaultValue: 'table',
    parse: (v): 'table' | 'cards' => (v === 'cards' ? 'cards' : 'table')
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WishlistWithCategory | null>(
    null
  )
  const [deletingItem, setDeletingItem] = useState<WishlistWithCategory | null>(
    null
  )

  const {
    categories,
    wishlistItems,
    isLoading,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    isCreating,
    isUpdating,
    isDeleting
  } = useWishlist()

  const filteredItems = useMemo(() => {
    return wishlistItems.filter((item) => {
      const { wishlist, category } = item

      if (categoryFilter !== 'ALL' && wishlist.categoryId !== categoryFilter) {
        return false
      }

      if (typeFilter !== 'ALL' && category?.type !== typeFilter) {
        return false
      }

      const currentPrice = wishlist.currentClosePrice
      const targetPrice = wishlist.targetPrice
      const hasTarget = targetPrice != null && targetPrice > 0

      if (targetStatusFilter === 'BELOW_OR_AT_TARGET') {
        if (!hasTarget || currentPrice == null || currentPrice > targetPrice) {
          return false
        }
      }

      if (targetStatusFilter === 'ABOVE_TARGET') {
        if (!hasTarget || currentPrice == null || currentPrice <= targetPrice) {
          return false
        }
      }

      if (targetStatusFilter === 'NO_TARGET') {
        if (hasTarget) {
          return false
        }
      }

      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = wishlist.name.toLowerCase().includes(query)
        const matchTicker = wishlist.ticker.toLowerCase().includes(query)
        const matchNotes = (wishlist.notes || '').toLowerCase().includes(query)
        if (!matchName && !matchTicker && !matchNotes) {
          return false
        }
      }

      return true
    })
  }, [wishlistItems, categoryFilter, typeFilter, targetStatusFilter, search])

  const handleResetFilters = () => {
    setSearch('')
    setCategoryFilter('ALL')
    setTypeFilter('ALL')
    setTargetStatusFilter('ALL')
  }

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
        data: {
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

  if (isLoading) {
    return (
      <div className="bg-background px-6 pt-4 pb-12">
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

  const hasAnyItem = wishlistItems.length > 0

  return (
    <div data-slot="wishlist-page" className="bg-background px-6 pt-4 pb-12">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Bookmark className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-3xl text-foreground">
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

        <WishlistFilters
          categories={categories}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={categoryFilter}
          onCategoryChange={setCategoryFilter}
          selectedType={typeFilter}
          onTypeChange={setTypeFilter}
          selectedTargetStatus={targetStatusFilter}
          onTargetStatusChange={setTargetStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onReset={handleResetFilters}
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
                onClick={handleResetFilters}
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
        ) : viewMode === 'table' ? (
          <WishlistTable
            items={filteredItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <WishlistCard
                key={item.wishlist.id}
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

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
          categoryFilter !== 'ALL' ? categoryFilter : undefined
        }
        editingItem={editingItem}
      />

      <DeleteWishlistDialog
        open={!!deletingItem}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null)
        }}
        itemName={deletingItem?.wishlist.name || ''}
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
