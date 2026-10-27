'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type {
  CreateAssetDTO,
  FixedIncomeIndexer
} from '@/features/assets/api/types'
import { INDEXER_OPTIONS } from '@/features/assets/utils/fixed-income'
import { Category, CategoryType } from '@/features/categories/api/types'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
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
import { parseValue } from '@/shared/utils/parse-value'

interface AssetFormDefaults {
  name: string
  ticker: string
  categoryId?: string
  quantity: number | null
  averagePrice: number | null
  currentClosePrice?: number | null
  broker: string
  isActive: boolean
  indexer?: FixedIncomeIndexer | null
  indexerRate?: number | null
  /** ISO ou AAAA-MM-DD */
  investedAt?: string | null
  maturityAt?: string | null
  /** Quantidade e preço médio vêm das operações: ficam só leitura */
  hasTransactions?: boolean
}

/** Valor do select de rendimento para saldo informado à mão */
const MANUAL = 'MANUAL'

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateAssetDTO) => Promise<void>
  isPending: boolean
  categories: Category[]
  initialCategoryId?: string
  defaultValues?: AssetFormDefaults
  /** Com `defaultValues` o padrão é editar; `create` só pré-preenche um novo ativo */
  mode?: 'create' | 'edit'
}

export function AssetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  categories,
  initialCategoryId,
  defaultValues,
  mode
}: AssetFormDialogProps) {
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [averagePrice, setAveragePrice] = useState('')
  const [currentClosePrice, setCurrentClosePrice] = useState('')
  const [broker, setBroker] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [indexer, setIndexer] = useState<FixedIncomeIndexer | typeof MANUAL>(
    MANUAL
  )
  const [indexerRate, setIndexerRate] = useState('')
  const [investedAt, setInvestedAt] = useState('')
  const [maturityAt, setMaturityAt] = useState('')

  const isEditing = mode ? mode === 'edit' : !!defaultValues

  useEffect(() => {
    if (open && defaultValues) {
      setName(defaultValues.name)
      setTicker(defaultValues.ticker)
      setCategoryId(
        defaultValues.categoryId || initialCategoryId || categories[0]?.id || ''
      )
      setQuantity(
        defaultValues.quantity != null ? String(defaultValues.quantity) : ''
      )
      setAveragePrice(
        defaultValues.averagePrice != null
          ? formatCurrencyInput(
              Math.round(defaultValues.averagePrice * 100).toString()
            )
          : ''
      )
      setCurrentClosePrice(
        defaultValues.currentClosePrice != null
          ? formatCurrencyInput(
              Math.round(defaultValues.currentClosePrice * 100).toString()
            )
          : ''
      )
      setBroker(defaultValues.broker || '')
      setIsActive(defaultValues.isActive ?? true)
      setIndexer(defaultValues.indexer ?? MANUAL)
      setIndexerRate(
        defaultValues.indexerRate != null
          ? String(defaultValues.indexerRate).replace('.', ',')
          : ''
      )
      setInvestedAt(defaultValues.investedAt?.slice(0, 10) ?? '')
      setMaturityAt(defaultValues.maturityAt?.slice(0, 10) ?? '')
    } else if (open) {
      setName('')
      setTicker('')
      setCategoryId(
        initialCategoryId || (categories.length > 0 ? categories[0].id : '')
      )
      setQuantity('')
      setAveragePrice('')
      setCurrentClosePrice('')
      setBroker('')
      setIsActive(true)
      setIndexer(MANUAL)
      setIndexerRate('')
      setInvestedAt('')
      setMaturityAt('')
    }
  }, [open, defaultValues, initialCategoryId, categories])

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  )
  const selectedCategoryLabel = selectedCategory?.name
  const isFixedIncome = selectedCategory?.type === CategoryType.FIXED
  const isBrl = selectedCategory?.currency === 'BRL'
  const hasTransactions = isEditing && !!defaultValues?.hasTransactions
  const indexerOption = INDEXER_OPTIONS.find(
    (option) => option.value === indexer
  )
  const isIndexed = isFixedIncome && !!indexerOption

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !categoryId) return

    const parsedQuantity = quantity.trim() !== '' ? Number(quantity) : null
    const parsedAveragePrice =
      averagePrice.trim() !== '' ? parseValue(averagePrice) : null
    const parsedCurrentClosePrice =
      currentClosePrice.trim() !== '' ? parseValue(currentClosePrice) : null
    const parsedIndexerRate =
      indexerRate.trim() !== '' ? Number(indexerRate.replace(',', '.')) : null

    // Só renda fixa tem indexador; nas outras categorias os campos não vão
    const indexation = isFixedIncome
      ? {
          indexer: isIndexed ? (indexer as FixedIncomeIndexer) : null,
          indexerRate:
            isIndexed &&
            parsedIndexerRate != null &&
            !Number.isNaN(parsedIndexerRate)
              ? parsedIndexerRate
              : null,
          investedAt: isIndexed && investedAt ? investedAt : null,
          maturityAt: isIndexed && maturityAt ? maturityAt : null
        }
      : {}

    await onSubmit({
      ...indexation,
      categoryId,
      name: name.trim(),
      ticker: ticker.trim(),
      quantity:
        parsedQuantity != null && !Number.isNaN(parsedQuantity)
          ? parsedQuantity
          : null,
      averagePrice:
        parsedAveragePrice != null && !Number.isNaN(parsedAveragePrice)
          ? parsedAveragePrice
          : null,
      currentClosePrice:
        parsedCurrentClosePrice != null &&
        !Number.isNaN(parsedCurrentClosePrice)
          ? parsedCurrentClosePrice
          : null,
      broker: broker.trim() || null,
      isActive
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="asset-form-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditing ? 'Editar Ativo' : 'Novo Ativo'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? 'Atualize as informações do ativo da sua carteira.'
              : 'Cadastre um novo ativo informando a categoria correspondente.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset-category" className="font-medium text-xs">
              Categoria *
            </Label>
            <Select
              value={categoryId}
              onValueChange={(val) => {
                if (val) setCategoryId(val)
              }}
              disabled={isPending || (isEditing && !!defaultValues?.categoryId)}
            >
              <SelectTrigger id="asset-category">
                <SelectValue placeholder="Selecione a categoria">
                  {selectedCategoryLabel ?? categoryId}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="mx-2 py-3">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asset-name" className="font-medium text-xs">
                Nome *
              </Label>
              <Input
                id="asset-name"
                placeholder="Ex: Nubank, Tesouro Selic..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-ticker" className="font-medium text-xs">
                Ticker
              </Label>
              <Input
                id="asset-ticker"
                placeholder="Ex: PETR4, AAPL, BTC..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="asset-quantity" className="font-medium text-xs">
                Quantidade
              </Label>
              <Input
                id="asset-quantity"
                type="number"
                step="any"
                min="0"
                placeholder="Ex: 10, 0.5..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isPending || hasTransactions}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-avg-price" className="font-medium text-xs">
                Preço Médio
              </Label>
              <Input
                id="asset-avg-price"
                type="text"
                placeholder="0,00"
                value={averagePrice}
                onChange={(e) =>
                  setAveragePrice(formatCurrencyInput(e.target.value))
                }
                disabled={isPending || hasTransactions}
              />
            </div>
          </div>

          {hasTransactions && (
            <p className="-mt-2 text-[11px] text-muted-foreground">
              Quantidade e preço médio são calculados pelas operações do ativo.
              Para mudar, registre ou edite uma operação no detalhe do ativo.
            </p>
          )}

          {isFixedIncome && (
            <div className="space-y-2">
              <Label htmlFor="asset-indexer" className="font-medium text-xs">
                Rendimento
              </Label>
              <Select
                value={indexer}
                onValueChange={(val) => {
                  if (val) setIndexer(val as FixedIncomeIndexer | typeof MANUAL)
                }}
                disabled={isPending}
              >
                <SelectTrigger id="asset-indexer">
                  <SelectValue>
                    {indexerOption?.label ?? 'Saldo informado manualmente'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value={MANUAL} className="mx-2 py-3">
                    Saldo informado manualmente
                  </SelectItem>
                  {INDEXER_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.brlOnly && !isBrl}
                      className="mx-2 py-3"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isIndexed && indexerOption && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="asset-indexer-rate"
                    className="font-medium text-xs"
                  >
                    {indexerOption.rateLabel} *
                  </Label>
                  <Input
                    id="asset-indexer-rate"
                    inputMode="decimal"
                    placeholder={indexerOption.ratePlaceholder}
                    value={indexerRate}
                    onChange={(e) =>
                      setIndexerRate(e.target.value.replace(/[^\d,.-]/g, ''))
                    }
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="asset-invested-at"
                    className="font-medium text-xs"
                  >
                    Aplicação *
                  </Label>
                  <Input
                    id="asset-invested-at"
                    type="date"
                    value={investedAt}
                    onChange={(e) => setInvestedAt(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="asset-maturity-at"
                    className="font-medium text-xs"
                  >
                    Vencimento
                  </Label>
                  <Input
                    id="asset-maturity-at"
                    type="date"
                    value={maturityAt}
                    min={investedAt || undefined}
                    onChange={(e) => setMaturityAt(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O saldo bruto (antes do IR) é recalculado todo dia útil a partir
                do valor aplicado: quantidade × preço médio. Para um CDB, use
                quantidade 1 e o valor aplicado como preço médio, com um ativo
                por aplicação.
              </p>
            </div>
          )}

          {isFixedIncome && !isIndexed && (
            <div className="space-y-2">
              <Label
                htmlFor="asset-current-price"
                className="font-medium text-xs"
              >
                Preço Atual / Saldo
              </Label>
              <Input
                id="asset-current-price"
                type="text"
                placeholder="Opcional (padrão: igual ao preço médio)"
                value={currentClosePrice}
                onChange={(e) =>
                  setCurrentClosePrice(formatCurrencyInput(e.target.value))
                }
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                Deixe em branco para usar o preço médio como saldo atual.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="asset-broker" className="font-medium text-xs">
              Corretora
            </Label>
            <Input
              id="asset-broker"
              placeholder="Ex: XP, Inter, Binance, Nubank..."
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="asset-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked === true)}
              disabled={isPending}
            />
            <Label htmlFor="asset-active" className="cursor-pointer text-xs">
              Ativo em carteira
            </Label>
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
              disabled={
                isPending ||
                !name.trim() ||
                !categoryId ||
                (isIndexed && (!indexerRate || !investedAt || !averagePrice))
              }
              className="text-xs"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Ativo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
