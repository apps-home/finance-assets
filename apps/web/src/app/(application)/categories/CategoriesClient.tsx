'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChartBarStacked, PlusIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { createAsset } from '@/features/assets/api'
import type { CreateAssetDTO } from '@/features/assets/api/types'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { listCategories } from '@/features/categories/api'
import type { Category } from '@/features/categories/api/types'
import { AllocationOverview } from '@/features/categories/components/AllocationOverview'
import { CategoryCard } from '@/features/categories/components/CategoryCard'
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog'
import { DeleteCategoryDialog } from '@/features/categories/components/DeleteCategoryDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

const FILTER_TABS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'FIXED', label: 'Renda Fixa' },
  { value: 'VARIABLE_BR', label: 'Ações BR' },
  { value: 'VARIABLE_US', label: 'Ações EUA' },
  { value: 'CRYPTO', label: 'Cripto' }
]

export default function CategoriesClient() {
  const queryClient = useQueryClient()
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [assetModalCategory, setAssetModalCategory] = useState<Category | null>(
    null
  )

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => listCategories(),
    placeholderData: (prev) => prev
  })

  const { mutateAsync: handleCreateAsset, isPending: isCreatingAsset } =
    useMutation({
      mutationFn: ({
        categoryId,
        data
      }: {
        categoryId: string
        data: CreateAssetDTO
      }) => createAsset(categoryId, data),
      onSuccess: (_, variables) => {
        toast.success('Ativo criado com sucesso!')
        queryClient.invalidateQueries({
          queryKey: ['assets', variables.categoryId]
        })
        queryClient.invalidateQueries({ queryKey: ['all-assets'] })
        setAssetModalCategory(null)
      },
      onError: () => {
        toast.error('Erro ao criar ativo.')
      }
    })

  const filteredCategories = categories.filter((cat) => {
    const matchesType = selectedFilter === 'ALL' || cat.type === selectedFilter
    const matchesSearch =
      !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
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
          <Skeleton className="h-10 w-96" />
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
    <div data-slot="categories-page" className="bg-background px-6 pt-4 pb-12">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <ChartBarStacked className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-3xl text-foreground">Categorias</h1>
              <p className="text-muted-foreground text-xs">
                Gerencie suas categorias de investimentos e metas de alocação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <Button onClick={() => setFormOpen(true)} className="gap-2 text-xs">
              <PlusIcon className="size-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
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
        </Tabs>

        {selectedFilter === 'ALL' && categories.length > 0 && (
          <AllocationOverview categories={categories} />
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
                ? 'Você ainda não possui categorias cadastradas. Crie sua primeira categoria para começar.'
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
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddAsset={handleAddAsset}
              />
            ))}
          </div>
        )}
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={handleCloseForm}
        editingCategory={editingCategory}
      />

      <DeleteCategoryDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        category={deletingCategory}
      />

      <AssetFormDialog
        open={!!assetModalCategory}
        onOpenChange={(open) => {
          if (!open) setAssetModalCategory(null)
        }}
        onSubmit={async (catId, data) => {
          await handleCreateAsset({ categoryId: catId, data })
        }}
        isPending={isCreatingAsset}
        categories={categories}
        initialCategoryId={assetModalCategory?.id}
      />
    </div>
  )
}
