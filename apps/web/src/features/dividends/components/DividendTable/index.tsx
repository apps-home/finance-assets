'use client'

import { Pencil, Trash2 } from 'lucide-react'

import { CATEGORY_TYPE_COLORS } from '@/features/categories/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatDate } from '@/shared/utils/format-date'

import { DividendSource, type DividendWithAsset } from '../../api/types'
import { DIVIDEND_TYPE_LABELS } from '../../utils'

interface DividendTableProps {
  items: DividendWithAsset[]
  onEdit: (item: DividendWithAsset) => void
  onDelete: (item: DividendWithAsset) => void
  className?: string
}

export function DividendTable({
  items,
  onEdit,
  onDelete,
  className
}: DividendTableProps) {
  const now = Date.now()

  return (
    <div
      data-slot="dividend-table"
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold text-xs">Pagamento</TableHead>
            <TableHead className="font-semibold text-xs">Ativo</TableHead>
            <TableHead className="font-semibold text-xs">Tipo</TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Por cota
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Total recebido
            </TableHead>
            <TableHead className="text-right font-semibold text-xs">
              Em R$
            </TableHead>
            <TableHead className="w-24 text-right font-semibold text-xs">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const { dividend, asset, category } = item
            const isFuture = new Date(dividend.paymentDate).getTime() > now
            const isForeign = category.currency !== 'BRL'

            return (
              <TableRow key={dividend.id} className="group">
                <TableCell className="py-3 text-xs tabular-nums">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {formatDate(dividend.paymentDate)}
                    </span>
                    {isFuture && (
                      <span className="text-[10px] text-primary">
                        a receber
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default" className="px-2 py-0.5 text-xs">
                      {asset.ticker || asset.name.slice(0, 3).toUpperCase()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'border-0 px-1.5 py-0 font-medium text-[10px]',
                        CATEGORY_TYPE_COLORS[category.type]
                      )}
                    >
                      {category.name}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="py-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>{DIVIDEND_TYPE_LABELS[dividend.type]}</span>
                    {dividend.source === DividendSource.SYNC && (
                      <Badge
                        variant="secondary"
                        className="border-0 bg-muted px-1.5 py-0 text-[10px] text-muted-foreground"
                      >
                        auto
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-3 text-right text-xs tabular-nums">
                  {dividend.rateAmount != null
                    ? formatCurrency(dividend.rateAmount, category.currency)
                    : '—'}
                </TableCell>

                <TableCell className="py-3 text-right font-semibold text-xs tabular-nums">
                  {dividend.taxAmount ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span>
                        {formatCurrency(
                          dividend.amount - dividend.taxAmount,
                          category.currency
                        )}
                      </span>
                      <span className="font-normal text-[10px] text-muted-foreground">
                        bruto{' '}
                        {formatCurrency(dividend.amount, category.currency)}
                      </span>
                    </div>
                  ) : (
                    formatCurrency(dividend.amount, category.currency)
                  )}
                </TableCell>

                <TableCell className="py-3 text-right text-xs tabular-nums">
                  {isForeign ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-medium">
                        {formatCurrency(dividend.amountInBRL)}
                      </span>
                      {dividend.exchangeRate != null && (
                        <span className="text-[10px] text-muted-foreground">
                          câmbio {dividend.exchangeRate.toFixed(4)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>

                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Editar provento"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            aria-label="Excluir provento"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        }
                      />
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
