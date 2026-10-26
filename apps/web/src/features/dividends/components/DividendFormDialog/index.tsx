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
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { toDateInputValue } from '@/shared/utils/format-date'
import { parseValue } from '@/shared/utils/parse-value'

import {
  type CreateDividendDTO,
  DividendType,
  type DividendWithAsset
} from '../../api/types'
import { DIVIDEND_TYPE_LABELS, DIVIDEND_TYPE_OPTIONS } from '../../utils'

interface DividendFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateDividendDTO) => Promise<void>
  isPending: boolean
  assets: AssetWithCategory[]
  editing?: DividendWithAsset | null
}

function toCurrencyInput(value: number | null | undefined) {
  return value != null
    ? formatCurrencyInput(Math.round(value * 100).toString())
    : ''
}

export function DividendFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  assets,
  editing
}: DividendFormDialogProps) {
  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState<DividendType>(DividendType.DIVIDEND)
  const [paymentDate, setPaymentDate] = useState('')
  const [comDate, setComDate] = useState('')
  const [rateAmount, setRateAmount] = useState('')
  const [amount, setAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')

  const isEditing = !!editing

  useEffect(() => {
    if (!open) return

    if (editing) {
      const { dividend } = editing

      setAssetId(dividend.assetId)
      setType(dividend.type)
      setPaymentDate(toDateInputValue(dividend.paymentDate))
      setComDate(dividend.comDate ? toDateInputValue(dividend.comDate) : '')
      setRateAmount(
        dividend.rateAmount != null ? String(dividend.rateAmount) : ''
      )
      setAmount(toCurrencyInput(dividend.amount))
      setTaxAmount(toCurrencyInput(dividend.taxAmount))
      setQuantity(dividend.quantity != null ? String(dividend.quantity) : '')
      setExchangeRate(
        dividend.exchangeRate != null ? String(dividend.exchangeRate) : ''
      )
      return
    }

    setAssetId(assets[0]?.id ?? '')
    setType(DividendType.DIVIDEND)
    setPaymentDate(toDateInputValue(new Date()))
    setComDate('')
    setRateAmount('')
    setAmount('')
    setTaxAmount('')
    setQuantity('')
    setExchangeRate('')
  }, [open, editing, assets])

  const selectedAsset = assets.find((asset) => asset.id === assetId)
  const currency = editing
    ? editing.category.currency
    : getCategoryCurrency(selectedAsset?.category)
  const isForeign = currency !== 'BRL'
  const categoryType = editing
    ? editing.category.type
    : selectedAsset?.category?.type
  // O servidor retém 30% por padrão em ações US quando o campo fica vazio
  const hasDefaultTax = !isEditing && categoryType === 'VARIABLE_US'

  const hasAmount = amount.trim() !== '' && parseValue(amount) > 0
  const hasRate = rateAmount.trim() !== '' && Number(rateAmount) > 0
  const hasQuantity = quantity.trim() !== '' && Number(quantity) > 0
  // Ao editar, o total só é enviado se o usuário mexeu nele; caso contrário o
  // servidor recalcula (valor por cota × quantidade) quando um deles mudar.
  const amountTouched =
    !editing || amount !== toCurrencyInput(editing.dividend.amount)
  // Só reenvia taxa/quantidade se mudaram: reenviar o valor original faria o
  // servidor recalcular e sobrescrever um total ajustado manualmente.
  const rateChanged =
    !editing || Number(rateAmount) !== (editing.dividend.rateAmount ?? 0)
  const quantityChanged =
    !editing || Number(quantity) !== (editing.dividend.quantity ?? 0)
  const hasTax = taxAmount.trim() !== '' && parseValue(taxAmount) > 0
  // Ao editar, limpar o campo envia 0 para remover a taxa já salva
  const taxChanged = taxAmount !== toCurrencyInput(editing?.dividend.taxAmount)
  const hasExchangeRate = exchangeRate.trim() !== '' && Number(exchangeRate) > 0

  const canSubmit =
    !!assetId &&
    !!paymentDate &&
    (hasAmount || hasRate) &&
    (!isForeign || hasExchangeRate)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!canSubmit) return

    await onSubmit({
      assetId,
      type,
      paymentDate,
      ...(comDate && { comDate }),
      ...(hasRate && rateChanged && { rateAmount: Number(rateAmount) }),
      ...(hasQuantity && quantityChanged && { quantity: Number(quantity) }),
      ...(hasAmount && amountTouched && { amount: parseValue(amount) }),
      ...(taxChanged && { taxAmount: hasTax ? parseValue(taxAmount) : 0 }),
      ...(isForeign &&
        hasExchangeRate && { exchangeRate: Number(exchangeRate) })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="dividend-form-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? 'Editar Provento' : 'Novo Provento'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? 'Atualize as informações do provento recebido.'
              : 'Registre um dividendo, JCP ou rendimento recebido.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dividend-asset" className="font-medium text-xs">
              Ativo *
            </Label>
            <Select
              value={assetId}
              onValueChange={(val) => {
                if (val) setAssetId(val)
              }}
              disabled={isPending || isEditing}
            >
              <SelectTrigger id="dividend-asset">
                <SelectValue placeholder="Selecione o ativo">
                  {editing
                    ? editing.asset.ticker || editing.asset.name
                    : selectedAsset
                      ? selectedAsset.ticker || selectedAsset.name
                      : assetId}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full">
                {assets.map((asset) => (
                  <SelectItem
                    key={asset.id}
                    value={asset.id}
                    className="mx-2 py-3"
                  >
                    {asset.ticker
                      ? `${asset.ticker} — ${asset.name}`
                      : asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dividend-type" className="font-medium text-xs">
                Tipo *
              </Label>
              <Select
                value={type}
                onValueChange={(val) => {
                  if (val) setType(val as DividendType)
                }}
                disabled={isPending}
              >
                <SelectTrigger id="dividend-type">
                  <SelectValue>{DIVIDEND_TYPE_LABELS[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {DIVIDEND_TYPE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="mx-2 py-3"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dividend-payment" className="font-medium text-xs">
                Data de pagamento *
              </Label>
              <Input
                id="dividend-payment"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dividend-rate" className="font-medium text-xs">
                Valor por cota
              </Label>
              <Input
                id="dividend-rate"
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 0,10"
                value={rateAmount}
                onChange={(e) => setRateAmount(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dividend-amount" className="font-medium text-xs">
                Total recebido {isForeign ? `(${currency})` : ''}
              </Label>
              <Input
                id="dividend-amount"
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dividend-tax" className="font-medium text-xs">
                Impostos/taxas retidos {isForeign ? `(${currency})` : ''}
              </Label>
              <Input
                id="dividend-tax"
                type="text"
                placeholder={
                  hasDefaultTax
                    ? 'Padrão: 30% retido (0,00 para nenhum)'
                    : '0,00 (opcional)'
                }
                value={taxAmount}
                onChange={(e) =>
                  setTaxAmount(formatCurrencyInput(e.target.value))
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="dividend-quantity"
                className="font-medium text-xs"
              >
                Quantidade de cotas
              </Label>
              <Input
                id="dividend-quantity"
                type="number"
                step="any"
                min="0"
                placeholder="Padrão: quantidade do ativo"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <p className="-mt-2 text-[11px] text-muted-foreground">
            Informe o total bruto (o que a API devolve) ou apenas o valor por
            cota — nesse caso o total é calculado com a quantidade. Ao editar,
            alterar o valor por cota ou a quantidade recalcula o total, a menos
            que você altere o total manualmente. Os impostos retidos são
            descontados do total nos resumos, que mostram o valor líquido.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dividend-com" className="font-medium text-xs">
                Data COM
              </Label>
              <Input
                id="dividend-com"
                type="date"
                value={comDate}
                onChange={(e) => setComDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            {isForeign && (
              <div className="space-y-2">
                <Label
                  htmlFor="dividend-exchange"
                  className="font-medium text-xs"
                >
                  Câmbio para R$ *
                </Label>
                <Input
                  id="dividend-exchange"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ex: 5,20"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

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
              disabled={isPending || !canSubmit}
              className="text-xs"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Registrar Provento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
