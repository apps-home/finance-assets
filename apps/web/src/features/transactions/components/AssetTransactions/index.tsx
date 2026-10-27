'use client'

import { Pencil, PlusIcon, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { getCategoryCurrency } from '@/features/categories/utils'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'
import { formatQuantity } from '@/shared/utils/format-number'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

import type { CreateTransactionDTO, Transaction } from '../../api/types'
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction
} from '../../hooks/use-transactions'
import { FACTOR_TYPES, TRANSACTION_TYPE_LABELS } from '../../utils'
import { TransactionFormDialog } from '../TransactionFormDialog'

interface AssetTransactionsProps {
  asset: AssetWithCategory
}

function describe(transaction: Transaction, currency: string) {
  if (FACTOR_TYPES.includes(transaction.type)) {
    return transaction.type === 'SPLIT'
      ? `1 para ${formatQuantity(transaction.factor ?? 0)}`
      : `${formatQuantity(transaction.factor ?? 0)} para 1`
  }

  return `${formatQuantity(transaction.quantity ?? 0, 8)} × ${formatCurrency(transaction.price ?? 0, currency)}`
}

export function AssetTransactions({ asset }: AssetTransactionsProps) {
  const currency = getCategoryCurrency(asset.category)
  const { data: items = [], isLoading } = useTransactions({
    assetId: asset.id
  })
  const { mutateAsync: createTransaction, isPending: isCreating } =
    useCreateTransaction()
  const { mutateAsync: updateTransaction, isPending: isUpdating } =
    useUpdateTransaction()
  const { mutateAsync: deleteTransaction, isPending: isDeleting } =
    useDeleteTransaction()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const hasPosition = (asset.quantity ?? 0) > 0

  async function handleSubmit(dto: CreateTransactionDTO) {
    if (editing) {
      const { assetId: _assetId, ...fields } = dto
      await updateTransaction({ id: editing.id, dto: fields })
    } else {
      await createTransaction(dto)
    }

    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div data-slot="asset-transactions" className="space-y-3">
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-border border-dashed p-3 text-center text-muted-foreground text-xs leading-relaxed">
          Registre compras, vendas e eventos para calcular a quantidade, o preço
          médio e o aporte do mês automaticamente.
          {hasPosition &&
            ' A posição atual vira o saldo inicial, na véspera da primeira operação: registre só o que ainda não está nela.'}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border text-xs">
          {items.map(({ transaction, result }) => (
            <li
              key={transaction.id}
              className="group flex items-center justify-between gap-2 px-3 py-2"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'border-0 px-1.5 py-0 text-[10px]',
                      transaction.type === 'BUY' &&
                        TREND_CLASSES.positive.badge,
                      transaction.type === 'SELL' &&
                        TREND_CLASSES.negative.badge
                    )}
                  >
                    {TRANSACTION_TYPE_LABELS[transaction.type]}
                  </Badge>
                  <span className="text-muted-foreground tabular-nums">
                    {formatDate(transaction.date)}
                  </span>
                </div>
                <span className="block text-foreground tabular-nums">
                  {describe(transaction, currency)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className="text-right">
                  {transaction.grossAmount > 0 && (
                    <span className="block font-semibold text-foreground tabular-nums">
                      {formatCurrency(transaction.grossAmount, currency)}
                    </span>
                  )}
                  {result !== null && (
                    <span
                      className={cn(
                        'tabular-nums',
                        result >= 0
                          ? TREND_CLASSES.positive.text
                          : TREND_CLASSES.negative.text
                      )}
                    >
                      {result >= 0 ? 'lucro ' : 'prejuízo '}
                      {formatCurrency(Math.abs(result), currency)}
                    </span>
                  )}
                </div>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label="Editar operação"
                        onClick={() => {
                          setEditing(transaction)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent>Editar operação</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Excluir operação"
                        onClick={() => setDeleting(transaction)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                  />
                  <TooltipContent>Excluir operação</TooltipContent>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
      >
        <PlusIcon className="size-3.5" />
        Nova operação
      </Button>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
        asset={asset}
        editing={editing}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Excluir operação"
        itemName={
          deleting
            ? `${TRANSACTION_TYPE_LABELS[deleting.type]} de ${formatDate(deleting.date)}`
            : ''
        }
        onConfirm={async () => {
          if (deleting) {
            await deleteTransaction(deleting.id)
            setDeleting(null)
          }
        }}
        isPending={isDeleting}
      />
    </div>
  )
}
