'use client'

import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import { Checkbox } from '@lib/ui/components/checkbox'
import { Input } from '@lib/ui/components/input'
import { Label } from '@lib/ui/components/label'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { Calculator, ChartBarStacked, PlusIcon, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { AssetWithCategory } from '@/features/assets/api/types'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { useAssets, useCreateAsset } from '@/features/assets/hooks/use-assets'
import { Category, CategoryType } from '@/features/categories/api/types'
import { AllocationOverview } from '@/features/categories/components/AllocationOverview'
import { CategoryCard } from '@/features/categories/components/CategoryCard'
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog'
import { ContributionPlannerDialog } from '@/features/categories/components/ContributionPlannerDialog'
import {
  useCategories,
  useDeleteCategory
} from '@/features/categories/hooks/use-category'
import { CategoryAllocation } from '@/features/categories/types/allocation'
import { CATEGORY_TYPE_OPTIONS } from '@/features/categories/utils'
import { calculateAllocations } from '@/features/categories/utils/calculate-allocations'
import { useDollarRate } from '@/shared/hooks/use-dollar-rate'

const FILTER_TABS: { value: CategoryType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  ...CATEGORY_TYPE_OPTIONS
]

export default function CategoriesClient() {
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [onlyWithAssets, setOnlyWithAssets] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [assetModalCategory, setAssetModalCategory] = useState<Category | null>(
    null
  )
  const [plannerOpen, setPlannerOpen] = useState(false)

  const { data: categories = [], isLoading } = useCategories()
  const { data: dollarQuote } = useDollarRate()

  const exchangeRates = useMemo(() => {
    const rates: Record<string, number> = {}
    const usd = dollarQuote?.bid ? Number.parseFloat(dollarQuote.bid) : NaN
    if (Number.isFinite(usd) && usd > 0) rates.USD = usd
    return rates
  }, [dollarQuote])

  const { data: assets = [], isLoading: isLoadingAssets } = useAssets()

  const assetsByCategory = useMemo(() => {
    const map = new Map<string, AssetWithCategory[]>()
    assets.forEach((asset) => {
      map.set(asset.categoryId, [...(map.get(asset.categoryId) ?? []), asset])
    })
    return map
  }, [assets])

  const categoryBalances = useMemo(() => {
    const map = new Map<string, number>()
    categories.forEach((cat) => {
      const balance = (assetsByCategory.get(cat.id) ?? []).reduce(
        (acc, asset) => acc + (asset.currentBalance || 0),
        0
      )
      map.set(cat.id, balance)
    })
    return map
  }, [categories, assetsByCategory])

  const allocationSummary = useMemo(() => {
    return calculateAllocations(categories, categoryBalances, exchangeRates)
  }, [categories, categoryBalances, exchangeRates])

  const hasTargets = allocationSummary.allocations.some(
    (item) => item.targetPercentage != null && item.targetPercentage > 0
  )

  const allocationMap = useMemo(() => {
    const map = new Map<string, CategoryAllocation>()
    allocationSummary.allocations.forEach((item) => {
      map.set(item.categoryId, item)
    })
    return map
  }, [allocationSummary])

  const isAssetsLoading = onlyWithAssets && isLoadingAssets

  const { mutateAsync: deleteCategory, isPending: isDeletingCategory } =
    useDeleteCategory()

  const { mutateAsync: handleCreateAsset, isPending: isCreatingAsset } =
    useCreateAsset()

  const filteredCategories = categories.filter((cat) => {
    const matchesType = selectedFilter === 'ALL' || cat.type === selectedFilter
    const matchesSearch =
      !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    const assetCount = assetsByCategory.get(cat.id)?.length ?? 0
    const matchesAssets = !onlyWithAssets || assetCount > 0
    return matchesType && matchesSearch && matchesAssets
  })

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormOpen(true)
  }

  const handleDelete = (category: Category) => {
    setDeletingCategory(category)
  }

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingCategory(null)
    }
  }

  const handleAddAsset = (category: Category) => {
    setAssetModalCategory(category)
  }

  if (isLoading || isAssetsLoading) {
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
          <Skeleton className="h-10 w-full max-w-96" />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="categories-page"
      className="bg-background px-4 pt-4 pb-12 sm:px-6"
    >
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <ChartBarStacked className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Categorias
              </h1>
              <p className="text-muted-foreground text-xs">
                Gerencie suas categorias de investimentos e metas de alocação
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            {hasTargets && (
              <Button
                variant="outline"
                onClick={() => setPlannerOpen(true)}
                className="gap-2 text-xs"
              >
                <Calculator className="size-4" />
                Simular aporte
              </Button>
            )}
            <Button onClick={() => setFormOpen(true)} className="gap-2 text-xs">
              <PlusIcon className="size-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
            <div className="max-w-full overflow-x-auto pb-1.5">
              <TabsList variant="line">
                {FILTER_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="cursor-pointer text-xs"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>

          <div className="flex items-center gap-2">
            <Checkbox
              id="only-with-assets"
              checked={onlyWithAssets}
              onCheckedChange={(checked) => setOnlyWithAssets(Boolean(checked))}
            />
            <Label
              htmlFor="only-with-assets"
              className="cursor-pointer font-medium text-muted-foreground text-xs hover:text-foreground"
            >
              Apenas com ativos
            </Label>
          </div>
        </div>

        {selectedFilter === 'ALL' && categories.length > 0 && (
          <AllocationOverview summary={allocationSummary} />
        )}

        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-xl bg-muted/50 p-4">
              <ChartBarStacked className="size-10 text-muted-foreground/60" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground text-lg">
              Nenhuma categoria encontrada
            </h3>
            <p className="max-w-sm text-muted-foreground text-xs">
              {selectedFilter === 'ALL'
                ? onlyWithAssets
                  ? 'Nenhuma categoria com ativos encontrada. Desmarque o filtro ou cadastre novos ativos.'
                  : 'Você ainda não possui categorias cadastradas. Crie sua primeira categoria para começar.'
                : `Nenhuma categoria do tipo "${FILTER_TABS.find((t) => t.value === selectedFilter)?.label}" encontrada.`}
            </p>
            {selectedFilter === 'ALL' && (
              <Button
                onClick={() => setFormOpen(true)}
                className="mt-4 gap-2 text-xs"
              >
                <PlusIcon className="size-4" />
                Criar primeira categoria
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                assets={assetsByCategory.get(category.id) ?? []}
                isLoadingAssets={isLoadingAssets}
                allocation={allocationMap.get(category.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddAsset={handleAddAsset}
              />
            ))}
          </div>
        )}
      </div>

      <ContributionPlannerDialog
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        summary={allocationSummary}
        exchangeRates={exchangeRates}
      />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={handleCloseForm}
        editingCategory={editingCategory}
      />

      <ConfirmDeleteDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        title="Confirmar Exclusão"
        lead="Tem certeza que deseja excluir a categoria"
        itemName={deletingCategory?.name || ''}
        confirmLabel="Excluir Categoria"
        onConfirm={async () => {
          if (deletingCategory) {
            await deleteCategory(deletingCategory.id)
            setDeletingCategory(null)
          }
        }}
        isPending={isDeletingCategory}
      />

      <AssetFormDialog
        open={!!assetModalCategory}
        onOpenChange={(open) => {
          if (!open) setAssetModalCategory(null)
        }}
        onSubmit={async (dto) => {
          await handleCreateAsset(dto)
          setAssetModalCategory(null)
        }}
        isPending={isCreatingAsset}
        categories={categories}
        initialCategoryId={assetModalCategory?.id}
      />
    </div>
  )
}
