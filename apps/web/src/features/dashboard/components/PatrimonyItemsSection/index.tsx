'use client'

import { Badge } from '@lib/ui/components/badge'
import { Button } from '@lib/ui/components/button'
import { ConfirmDeleteDialog } from '@lib/ui/components/ConfirmDeleteDialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import { Building2, Pencil, Plus, Scale, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { formatCurrency } from '@/shared/utils/format-currency'

import type { PatrimonyItem, PatrimonySummary } from '../../api/types'
import { useDeletePatrimonyItem } from '../../hooks/use-patrimony-items'
import {
  calculateNetWorthBreakdown,
  PATRIMONY_ITEM_TYPE_BADGE,
  PATRIMONY_ITEM_TYPE_ICONS,
  PATRIMONY_ITEM_TYPE_LABELS
} from '../../utils/patrimony-items'
import { PatrimonyItemDialog } from './PatrimonyItemDialog'

interface PatrimonyItemsSectionProps {
  items: PatrimonyItem[]
  summary: PatrimonySummary
  financialTotal: number
}

function formatVariation(item: PatrimonyItem): {
  label: string
  positive: boolean
} | null {
  if (item.purchaseValue == null || item.purchaseValue <= 0) return null

  if (item.isLiability) {
    const paidOff = item.purchaseValue - item.currentValue
    const pct = (paidOff / item.purchaseValue) * 100
    if (pct <= 0) return null
    return {
      label: `${pct.toFixed(0)}% amortizado`,
      positive: true
    }
  }

  const diff = item.currentValue - item.purchaseValue
  const pct = (diff / item.purchaseValue) * 100
  return {
    label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs. aquisição`,
    positive: pct >= 0
  }
}

export function PatrimonyItemsSection({
  items,
  summary,
  financialTotal
}: PatrimonyItemsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PatrimonyItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<PatrimonyItem | null>(null)

  const { mutateAsync: deleteItem, isPending: isDeleting } =
    useDeletePatrimonyItem()

  const breakdown = calculateNetWorthBreakdown(financialTotal, summary)

  function handleCreate() {
    setEditingItem(null)
    setDialogOpen(true)
  }

  function handleEdit(item: PatrimonyItem) {
    setEditingItem(item)
    setDialogOpen(true)
  }

  return (
    <section
      data-slot="patrimony-items-section"
      aria-label="Bens Imobilizados e Passivos"
      className="space-y-5 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="size-4.5" />
          </div>
          <div>
            <h2 className="font-semibold text-xl">
              Bens Imobilizados & Passivos
            </h2>
            <p className="text-muted-foreground text-xs">
              Imóveis, veículos, equipamentos e financiamentos que compõem seu
              Patrimônio Líquido Completo (Net Worth)
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          className="h-9 gap-1.5 text-xs"
        >
          <Plus className="size-3.5 text-primary" />
          Adicionar bem ou passivo
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Ativos Financeiros Líquidos"
              value={formatCurrency(breakdown.financialAssets)}
              hint={`${breakdown.liquidSharePct.toFixed(1)}% do patrimônio bruto`}
            />
            <SummaryTile
              label="+ Bens Imobilizados"
              value={formatCurrency(breakdown.physicalAssets)}
              hint={`${breakdown.immobilizedSharePct.toFixed(1)}% imobilizado`}
            />
            <SummaryTile
              label="− Passivos & Dívidas"
              value={
                breakdown.liabilities > 0
                  ? `- ${formatCurrency(breakdown.liabilities)}`
                  : formatCurrency(0)
              }
              valueClassName={
                breakdown.liabilities > 0 ? 'text-destructive' : undefined
              }
              hint="Saldo devedor ativo"
            />
            <SummaryTile
              label="= Patrimônio Líquido (Net Worth)"
              value={formatCurrency(breakdown.netWorth)}
              valueClassName="text-primary"
              hint={`Saldo físico líquido: ${breakdown.netPhysicalBalance >= 0 ? '+' : ''}${formatCurrency(breakdown.netPhysicalBalance)}`}
            />
          </div>

          {breakdown.grossAssets > 0 && (
            <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-medium text-foreground">
                  Índice de Liquidez Patrimonial
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {breakdown.liquidSharePct.toFixed(0)}% em Ativos Financeiros
                  Líquidos · {breakdown.immobilizedSharePct.toFixed(0)}%
                  Imobilizado
                </span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${breakdown.liquidSharePct}%` }}
                />
                <div
                  className="h-full bg-chart-2 transition-all duration-500"
                  style={{ width: `${breakdown.immobilizedSharePct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 border-dashed py-10 text-center">
          <div className="mb-3 rounded-xl bg-muted/50 p-3">
            <Building2 className="size-6 text-muted-foreground/70" />
          </div>
          <p className="font-medium text-foreground text-sm">
            Nenhum bem físico ou passivo cadastrado
          </p>
          <p className="mt-1 mb-4 max-w-md text-muted-foreground text-xs">
            Adicione imóveis, veículos (Tabela FIPE), equipamentos ou saldo
            devedor de financiamentos para acompanhar seu Patrimônio Líquido
            Completo.
          </p>
          <Button size="sm" onClick={handleCreate} className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            Cadastrar primeiro item
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-lg border border-border/60">
          {items.map((item) => {
            const Icon = PATRIMONY_ITEM_TYPE_ICONS[item.type]
            const variation = formatVariation(item)

            return (
              <div
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between',
                  !item.isActive && 'opacity-55'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border',
                      PATRIMONY_ITEM_TYPE_BADGE[item.type]
                    )}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {item.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          PATRIMONY_ITEM_TYPE_BADGE[item.type]
                        )}
                      >
                        {PATRIMONY_ITEM_TYPE_LABELS[item.type]}
                      </Badge>
                      {!item.isActive && (
                        <Badge variant="outline" className="text-[10px]">
                          Inativo
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                      {item.purchaseValue != null && item.purchaseValue > 0 && (
                        <span>
                          {item.isLiability ? 'Original: ' : 'Aquisição: '}
                          {formatCurrency(item.purchaseValue)}
                        </span>
                      )}
                      {variation && (
                        <span
                          className={cn(
                            'font-medium',
                            variation.positive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}
                        >
                          {variation.label}
                        </span>
                      )}
                      {item.notes && <span>{item.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span
                    className={cn(
                      'font-bold text-sm tabular-nums',
                      item.isLiability ? 'text-destructive' : 'text-foreground'
                    )}
                  >
                    {item.isLiability ? '- ' : ''}
                    {formatCurrency(item.currentValue)}
                  </span>

                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="size-8 text-muted-foreground hover:text-foreground"
                          />
                        }
                      >
                        <Pencil className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Editar item</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingItem(item)}
                            className="size-8 text-muted-foreground hover:text-destructive"
                          />
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>Remover item</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dialogOpen && (
        <PatrimonyItemDialog
          key={editingItem?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
        />
      )}

      {deletingItem && (
        <ConfirmDeleteDialog
          open={Boolean(deletingItem)}
          onOpenChange={(open) => !open && setDeletingItem(null)}
          title="Remover item patrimonial"
          itemName={deletingItem.name}
          onConfirm={async () => {
            await deleteItem(deletingItem.id)
            setDeletingItem(null)
          }}
          isPending={isDeleting}
        />
      )}
    </section>
  )
}

function SummaryTile({
  label,
  value,
  hint,
  valueClassName
}: {
  label: string
  value: string
  hint: string
  valueClassName?: string
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'font-bold text-foreground text-sm tabular-nums',
          valueClassName
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}
