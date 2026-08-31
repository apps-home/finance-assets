'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase,
  Building2,
  CircleOff,
  Edit2,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import {
  createAsset,
  deleteAsset,
  listAssetsByCategory,
  updateAsset
} from '@/features/assets/api'
import type {
  AssetHTTPResponse,
  CreateAssetDTO,
  UpdateAssetDTO
} from '@/features/assets/api/types'
import { Category, CategoryType } from '@/features/categories/api/types'
import { AssetFormDialog } from '@/features/categories/components/AssetFormDialog'
import { AssetPriceInfo } from '@/features/categories/components/AssetPriceInfo'
import { DeleteAssetDialog } from '@/features/categories/components/DeleteAssetDialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'

interface CategoryDetailCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const CATEGORY_TYPE_COLORS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  [CategoryType.VARIABLE_US]: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  [CategoryType.CRYPTO]: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
}

const CATEGORY_TYPE_BG: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'bg-emerald-500',
  [CategoryType.VARIABLE_BR]: 'bg-blue-500',
  [CategoryType.VARIABLE_US]: 'bg-violet-500',
  [CategoryType.CRYPTO]: 'bg-amber-500'
}

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.FIXED]: 'Renda Fixa',
  [CategoryType.VARIABLE_BR]: 'Ações Brasil',
  [CategoryType.VARIABLE_US]: 'Ações EUA',
  [CategoryType.CRYPTO]: 'Cripto'
}

const CURRENCY_LABELS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£'
}

export function CategoryDetailCard({
  category,
  onEdit,
  onDelete
}: CategoryDetailCardProps) {
  const queryClient = useQueryClient()
  const categoryType = category.type

  const [formOpen, setFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AssetHTTPResponse | null>(
    null
  )
  const [deletingAsset, setDeletingAsset] = useState<AssetHTTPResponse | null>(
    null
  )

  const { data: assets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets', category.id],
    queryFn: () => listAssetsByCategory(category.id)
  })

  const { mutateAsync: handleCreate, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateAssetDTO) => createAsset(category.id, data),
    onSuccess: () => {
      toast.success('Ativo criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['assets', category.id] })
      setFormOpen(false)
    },
    onError: () => {
      toast.error('Erro ao criar ativo.')
    }
  })

  const { mutateAsync: handleUpdate, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetDTO }) =>
      updateAsset(category.id, id, data),
    onSuccess: () => {
      toast.success('Ativo atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['assets', category.id] })
      setEditingAsset(null)
    },
    onError: () => {
      toast.error('Erro ao atualizar ativo.')
    }
  })

  const { mutateAsync: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteAsset(category.id, id),
    onSuccess: () => {
      toast.success('Ativo removido com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['assets', category.id] })
      setDeletingAsset(null)
    },
    onError: () => {
      toast.error('Erro ao remover ativo.')
    }
  })

  const handleAssetInitials = useCallback((name: string) => {
    return name.substring(0, 3).toUpperCase()
  }, [])

  const assetCount = assets?.length || 0
  const targetPercentage = category.targetPercentage

  // Aggregated totals
  const totals = (assets || []).reduce(
    (acc, asset) => ({
      investedValue: acc.investedValue + (asset.investedValue || 0),
      currentBalance: acc.currentBalance + (asset.currentBalance || 0),
      profitLoss: acc.profitLoss + (asset.profitLoss || 0)
    }),
    { investedValue: 0, currentBalance: 0, profitLoss: 0 }
  )

  const totalProfitPercentage =
    totals.investedValue > 0
      ? ((totals.currentBalance - totals.investedValue) /
          totals.investedValue) *
        100
      : 0

  return (
    <>
      <Card
        data-slot="category-detail-card"
        className="flex flex-col overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md"
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-11 items-center justify-center rounded-xl',
                CATEGORY_TYPE_COLORS[categoryType]
              )}
            >
              <TrendingUp className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    'border-0 text-xs',
                    CATEGORY_TYPE_COLORS[categoryType]
                  )}
                >
                  {CATEGORY_TYPE_LABELS[categoryType] || categoryType}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {CURRENCY_LABELS[category.currency] || category.currency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onEdit(category)}
            >
              <Edit2 className="size-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive/80"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">
                Meta de Alocação
              </span>
            </div>

            {targetPercentage != null && targetPercentage > 0 ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-end justify-between">
                  <span className="font-bold text-3xl text-primary tabular-nums">
                    {targetPercentage}%
                  </span>
                  <span className="text-muted-foreground text-xs">
                    do patrimônio
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      CATEGORY_TYPE_BG[categoryType] || 'bg-primary'
                    )}
                    style={{
                      width: `${Math.min(targetPercentage, 100)}%`
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground text-xs">
                Nenhuma meta definida. Edite a categoria para configurar.
              </p>
            )}
          </div>

          {category.years && category.years.length > 0 && (
            <div className="space-y-2">
              <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Competências
              </span>
              <div className="flex flex-wrap gap-1.5">
                {category.years
                  .sort((a, b) => a - b)
                  .map((year) => (
                    <span
                      key={year}
                      className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs"
                    >
                      {year}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Ativos
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="border-0 text-xs">
                  {assetCount} {assetCount === 1 ? 'ativo' : 'ativos'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormOpen(true)}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Plus className="size-3" />
                  Adicionar
                </Button>
              </div>
            </div>

            {isLoadingAssets ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : assetCount === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border border-dashed py-8">
                <Briefcase className="mb-2 size-6 text-muted-foreground/40" />
                <span className="text-muted-foreground text-xs">
                  Nenhum ativo cadastrado
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setFormOpen(true)}
                  className="mt-1 text-primary text-xs"
                >
                  <Plus className="size-3" />
                  Adicionar primeiro ativo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(assets || []).map((asset) => {
                  const hasPL =
                    asset.profitLoss != null && asset.profitLoss !== 0
                  const isPositivePL = hasPL && asset.profitLoss! > 0
                  const isNegativePL = hasPL && asset.profitLoss! < 0

                  return (
                    <div
                      key={asset.id}
                      className={cn(
                        'group rounded-xl border border-border/50 bg-muted/10 p-3 transition-colors hover:bg-muted/30',
                        !asset.isActive && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Badge
                            variant="default"
                            className="shrink-0 px-2 py-0.5 font-bold text-xs"
                          >
                            {asset.ticker || handleAssetInitials(asset.name)}
                          </Badge>
                          <span className="truncate font-medium text-foreground text-sm">
                            {asset.name}
                          </span>
                          {!asset.isActive && (
                            <Badge
                              variant="secondary"
                              className="gap-1 border-0 bg-muted text-muted-foreground text-xs"
                            >
                              <CircleOff className="size-3" />
                              Inativo
                            </Badge>
                          )}
                          {asset.broker && (
                            <span className="flex items-center gap-1 text-muted-foreground text-xs">
                              <Building2 className="size-3" />
                              {asset.broker}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => setEditingAsset(asset)}
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive/80"
                            onClick={() => setDeletingAsset(asset)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-3">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground/60 text-xs">
                            Quantidade
                          </span>
                          <p className="font-semibold text-foreground text-sm tabular-nums">
                            {asset.quantity != null
                              ? asset.quantity.toLocaleString('pt-BR')
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground/60 text-xs">
                            Preço Médio
                          </span>
                          <p className="font-semibold text-foreground text-sm tabular-nums">
                            {asset.averagePrice != null
                              ? formatCurrency(asset.averagePrice)
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground/60 text-xs">
                            Valor Investido
                          </span>
                          <p className="font-medium text-foreground text-sm tabular-nums">
                            {asset.investedValue != null
                              ? formatCurrency(asset.investedValue)
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground/60 text-xs">
                            Saldo Atual
                          </span>
                          <p className="font-semibold text-foreground text-sm tabular-nums">
                            {asset.currentBalance != null
                              ? formatCurrency(asset.currentBalance)
                              : '—'}
                          </p>
                        </div>
                      </div>

                      {categoryType !== 'FIXED' && (
                        <div className="mt-3">
                          <AssetPriceInfo
                            currentClosePrice={asset.currentClosePrice}
                            lastMonthClosePrice={asset.lastMonthClosePrice}
                          />
                        </div>
                      )}

                      {hasPL && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'gap-1 border-0 px-2 py-1 font-semibold text-xs tabular-nums',
                              isPositivePL &&
                                'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                              isNegativePL &&
                                'bg-red-500/15 text-red-600 dark:text-red-400'
                            )}
                          >
                            {isPositivePL ? (
                              <TrendingUp className="size-3" />
                            ) : (
                              <TrendingDown className="size-3" />
                            )}
                            {formatCurrency(Math.abs(asset.profitLoss!))}
                          </Badge>
                          {asset.profitabilityPercentage != null && (
                            <span
                              className={cn(
                                'font-medium text-xs tabular-nums',
                                isPositivePL &&
                                  'text-emerald-600 dark:text-emerald-400',
                                isNegativePL && 'text-red-600 dark:text-red-400'
                              )}
                            >
                              {formatPercentage(asset.profitabilityPercentage)}
                            </span>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {isPositivePL ? 'de lucro' : 'de prejuízo'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}

                <Separator />
                <div className="grid grid-cols-4 gap-3 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs">
                      Total Ativos
                    </span>
                    <p className="font-semibold text-foreground text-sm">
                      {assetCount}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs">
                      Total Investido
                    </span>
                    <p className="font-semibold text-foreground text-sm tabular-nums">
                      {formatCurrency(totals.investedValue)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs">
                      Saldo Atual
                    </span>
                    <p className="font-semibold text-foreground text-sm tabular-nums">
                      {formatCurrency(totals.currentBalance)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground/60 text-xs">
                      Lucro / Prejuízo
                    </span>
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          'font-semibold text-sm tabular-nums',
                          totals.profitLoss > 0 &&
                            'text-emerald-600 dark:text-emerald-400',
                          totals.profitLoss < 0 &&
                            'text-red-600 dark:text-red-400',
                          totals.profitLoss === 0 && 'text-muted-foreground'
                        )}
                      >
                        {totals.profitLoss >= 0 ? '+' : ''}
                        {formatCurrency(totals.profitLoss)}
                      </p>
                      {totalProfitPercentage !== 0 && (
                        <span
                          className={cn(
                            'font-medium text-xs tabular-nums',
                            totalProfitPercentage > 0 &&
                              'text-emerald-600 dark:text-emerald-400',
                            totalProfitPercentage < 0 &&
                              'text-red-600 dark:text-red-400'
                          )}
                        >
                          {formatPercentage(totalProfitPercentage)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={async (data) => {
          await handleCreate(data)
        }}
        isPending={isCreating}
        categoryName={category.name}
      />

      <AssetFormDialog
        open={!!editingAsset}
        onOpenChange={(open) => {
          if (!open) setEditingAsset(null)
        }}
        onSubmit={async (data) => {
          if (editingAsset) {
            await handleUpdate({ id: editingAsset.id, data })
          }
        }}
        isPending={isUpdating}
        categoryName={category.name}
        defaultValues={
          editingAsset
            ? {
                name: editingAsset.name,
                ticker: editingAsset.ticker || '',
                quantity: editingAsset.quantity,
                averagePrice: editingAsset.averagePrice,
                broker: editingAsset.broker || '',
                isActive: editingAsset.isActive
              }
            : undefined
        }
      />

      <DeleteAssetDialog
        open={!!deletingAsset}
        onOpenChange={(open) => {
          if (!open) setDeletingAsset(null)
        }}
        assetName={deletingAsset?.name || ''}
        onConfirm={async () => {
          if (deletingAsset) {
            await handleDelete(deletingAsset.id)
          }
        }}
        isPending={isDeleting}
      />
    </>
  )
}
