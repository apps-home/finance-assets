'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { getCategoryCurrency } from '@/features/categories/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { toDateInputValue } from '@/shared/utils/format-date'
import { parseValue } from '@/shared/utils/parse-value'

import type {
  CreateTransactionDTO,
  Transaction,
  TransactionType
} from '../../api/types'
import {
  CASH_TYPES,
  FACTOR_TYPES,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_TYPE_OPTIONS
} from '../../utils'

interface TransactionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTransactionDTO) => Promise<void>
  isPending: boolean
  asset: AssetWithCategory
  editing?: Transaction | null
}

function toCurrencyInput(value: number | null | undefined) {
  return value != null
    ? formatCurrencyInput(Math.round(value * 100).toString())
    : ''
}

/** Aceita vírgula ou ponto como separador decimal */
function parseDecimal(value: string): number | null {
  if (value.trim() === '') return null

  const parsed = Number(value.replace(',', '.'))
  return Number.isNaN(parsed) ? null : parsed
}

const PRICE_LABELS: Partial<Record<TransactionType, string>> = {
  OPENING: 'Preço médio',
  BONUS: 'Custo atribuído por ação'
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  asset,
  editing
}: TransactionFormDialogProps) {
  const currency = getCategoryCurrency(asset.category)
  const isForeign = currency !== 'BRL'

  const [type, setType] = useState<TransactionType>('BUY')
  const [date, setDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [fees, setFees] = useState('')
  const [factor, setFactor] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return

    setType(editing?.type ?? 'BUY')
    setDate(
      editing ? toDateInputValue(editing.date) : toDateInputValue(new Date())
    )
    setQuantity(editing?.quantity != null ? String(editing.quantity) : '')
    setPrice(toCurrencyInput(editing?.price))
    setFees(editing?.fees ? toCurrencyInput(editing.fees) : '')
    setFactor(editing?.factor != null ? String(editing.factor) : '')
    setExchangeRate(
      editing?.exchangeRate != null
        ? String(editing.exchangeRate).replace('.', ',')
        : ''
    )
    setNotes(editing?.notes ?? '')
  }, [open, editing])

  const isFactor = FACTOR_TYPES.includes(type)
  const movesCash = CASH_TYPES.includes(type)
  const needsRate = movesCash && isForeign

  const parsedQuantity = parseDecimal(quantity)
  const parsedPrice = price.trim() !== '' ? parseValue(price) : null
  const parsedFees = fees.trim() !== '' ? parseValue(fees) : 0
  const parsedFactor = parseDecimal(factor)
  const parsedRate = parseDecimal(exchangeRate)

  const gross =
    parsedQuantity != null && parsedPrice != null
      ? parsedQuantity * parsedPrice
      : null
  const total =
    gross === null
      ? null
      : type === 'BUY'
        ? gross + parsedFees
        : type === 'SELL'
          ? gross - parsedFees
          : gross

  const isValid =
    !!date &&
    (isFactor
      ? parsedFactor != null && parsedFactor > 0 && parsedFactor !== 1
      : parsedQuantity != null &&
        parsedQuantity > 0 &&
        parsedPrice != null &&
        (type === 'BONUS' || parsedPrice > 0)) &&
    (!needsRate || (parsedRate != null && parsedRate > 0))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid) return

    await onSubmit({
      assetId: asset.id,
      type,
      date,
      quantity: isFactor ? null : parsedQuantity,
      price: isFactor ? null : parsedPrice,
      fees: movesCash ? parsedFees : 0,
      factor: isFactor ? parsedFactor : null,
      exchangeRate: needsRate ? parsedRate : null,
      notes: notes.trim() || null
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="transaction-form-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-base">
            {editing ? 'Editar operação' : 'Nova operação'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {asset.ticker || asset.name}: quantidade e preço médio são
            recalculados a partir das operações.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transaction-type" className="font-medium text-xs">
                Tipo *
              </Label>
              <Select
                value={type}
                onValueChange={(val) => {
                  if (val) setType(val as TransactionType)
                }}
                disabled={isPending}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue>{TRANSACTION_TYPE_LABELS[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {TRANSACTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option}
                      value={option}
                      className="mx-2 py-3"
                    >
                      {TRANSACTION_TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-date" className="font-medium text-xs">
                Data *
              </Label>
              <Input
                id="transaction-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {isFactor ? (
            <div className="space-y-2">
              <Label
                htmlFor="transaction-factor"
                className="font-medium text-xs"
              >
                Proporção *
              </Label>
              <Input
                id="transaction-factor"
                inputMode="decimal"
                placeholder={type === 'SPLIT' ? 'Ex: 2' : 'Ex: 10'}
                value={factor}
                onChange={(e) =>
                  setFactor(e.target.value.replace(/[^\d,.]/g, ''))
                }
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                {type === 'SPLIT'
                  ? 'Quantas ações cada ação virou (1 para 2: informe 2). O custo total não muda.'
                  : 'Quantas ações viraram uma (10 para 1: informe 10). O custo total não muda.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="transaction-quantity"
                  className="font-medium text-xs"
                >
                  Quantidade *
                </Label>
                <Input
                  id="transaction-quantity"
                  inputMode="decimal"
                  placeholder="Ex: 10"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value.replace(/[^\d,.]/g, ''))
                  }
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="transaction-price"
                  className="font-medium text-xs"
                >
                  {PRICE_LABELS[type] ?? 'Preço unitário'} ({currency}) *
                </Label>
                <Input
                  id="transaction-price"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={price}
                  onChange={(e) =>
                    setPrice(formatCurrencyInput(e.target.value))
                  }
                  disabled={isPending}
                />
              </div>
            </div>
          )}

          {movesCash && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="transaction-fees"
                  className="font-medium text-xs"
                >
                  Taxas ({currency})
                </Label>
                <Input
                  id="transaction-fees"
                  inputMode="decimal"
                  placeholder="Corretagem, emolumentos"
                  value={fees}
                  onChange={(e) => setFees(formatCurrencyInput(e.target.value))}
                  disabled={isPending}
                />
              </div>
              {needsRate && (
                <div className="space-y-2">
                  <Label
                    htmlFor="transaction-rate"
                    className="font-medium text-xs"
                  >
                    Câmbio (R$ por {currency}) *
                  </Label>
                  <Input
                    id="transaction-rate"
                    inputMode="decimal"
                    placeholder="Ex: 5,42"
                    value={exchangeRate}
                    onChange={(e) =>
                      setExchangeRate(e.target.value.replace(/[^\d,.]/g, ''))
                    }
                    disabled={isPending}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="transaction-notes" className="font-medium text-xs">
              Observação
            </Label>
            <Input
              id="transaction-notes"
              placeholder="Opcional"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
            />
          </div>

          {total !== null && !isFactor && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
              <span className="text-muted-foreground">
                {type === 'SELL' ? 'Valor líquido da venda' : 'Total'}
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(total, currency)}
                {needsRate && parsedRate ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({formatCurrency(total * parsedRate)})
                  </span>
                ) : null}
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              }
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !isValid}
              className="text-xs"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
