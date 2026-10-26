'use client'

import { CalendarCheck, Info, Loader2, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useAssets } from '@/features/assets/hooks/use-assets'
import type { Category } from '@/features/categories/api/types'
import {
  CATEGORY_TYPE_BG,
  CATEGORY_TYPE_COLORS,
  CATEGORY_TYPE_LABELS
} from '@/features/categories/utils'
import type { CreateBudgetDTO } from '@/features/dashboard/api/types'
import { useSaveMonthClosing } from '@/features/dashboard/hooks/use-budget'
import type { MonthData } from '@/features/dashboard/types/month-data'
import {
  buildClosingDefaults,
  type ClosingAmountSource,
  type ClosingRowDefaults,
  canSuggestFromQuote,
  VARIABLE_TYPES
} from '@/features/dashboard/utils/month-closing'
import { useDividends } from '@/features/dividends/hooks/use-dividends'
import { getCurrencyData } from '@/infrastructure/services/external/get-currency'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { MONTH_NAMES } from '@/shared/utils/month-names'
import { parseValue } from '@/shared/utils/parse-value'

const SOURCE_LABEL: Record<Exclude<ClosingAmountSource, null>, string> = {
  saved: 'Registrado',
  quote: 'Pela cotação atual',
  previous: 'Repetido do mês anterior'
}

interface MonthClosingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  categories: Category[]
  data: MonthData[]
}

/** Mês atual no ano corrente; dezembro em anos anteriores */
function defaultMonth(year: number) {
  const now = new Date()
  return year === now.getFullYear() ? now.getMonth() + 1 : 12
}

export function MonthClosingDialog({
  open,
  onOpenChange,
  year,
  categories,
  data
}: MonthClosingDialogProps) {
  const [month, setMonth] = useState(() => defaultMonth(year))

  const { data: assets = [], isLoading: isLoadingAssets } = useAssets({
    status: 'ACTIVE'
  })
  const { data: dividends = [], isLoading: isLoadingDividends } = useDividends({
    year
  })

  const isLoading = isLoadingAssets || isLoadingDividends

  const now = new Date()
  const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const monthOptions = MONTH_NAMES.slice(0, lastMonth)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="month-closing-dialog"
        className="flex max-h-[90svh] flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-border/60 border-b p-4">
          <div className="flex flex-col gap-3 pr-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarCheck className="size-4.5" />
              </div>
              <div>
                <DialogTitle>Fechar mês</DialogTitle>
                <DialogDescription>
                  Confira os valores sugeridos e salve todas as categorias de
                  uma vez.
                </DialogDescription>
              </div>
            </div>

            <Select
              value={String(month)}
              onValueChange={(value) => value && setMonth(Number(value))}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:w-44">
                <SelectValue>
                  {MONTH_NAMES[month - 1]} de {year}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((name, index) => (
                  <SelectItem
                    key={name}
                    value={String(index + 1)}
                    className="mx-1 py-2 text-xs"
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <MonthClosingForm
            key={`${year}-${month}`}
            year={year}
            month={month}
            defaults={buildClosingDefaults({
              categories,
              data,
              year,
              month,
              assets,
              dividends
            })}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface RowValues {
  amount: string
  dividend: string
  contribution: string
}

const toInput = (value: number | null) =>
  value != null && value > 0
    ? formatCurrencyInput(Math.round(value * 100).toString())
    : ''

function initialValues(row: ClosingRowDefaults): RowValues {
  return {
    amount: toInput(row.amount),
    dividend: toInput(row.dividend),
    contribution: toInput(row.contribution)
  }
}

interface MonthClosingFormProps {
  year: number
  month: number
  defaults: ClosingRowDefaults[]
  onDone: () => void
}

function MonthClosingForm({
  year,
  month,
  defaults,
  onDone
}: MonthClosingFormProps) {
  // Os padrões são fixados ao abrir o mês: refetch não apaga o que foi editado
  const [initial] = useState(() =>
    Object.fromEntries(
      defaults.map((row) => [row.category.id, initialValues(row)])
    )
  )
  const [values, setValues] = useState<Record<string, RowValues>>(initial)
  const [isPreparing, setIsPreparing] = useState(false)

  const { mutateAsync: saveClosing, isPending } = useSaveMonthClosing()
  const isSaving = isPreparing || isPending

  const quoteAvailable = canSuggestFromQuote(year, month, new Date())

  const pendingCount = useMemo(
    () => defaults.filter((row) => isChanged(row, values, initial)).length,
    [defaults, values, initial]
  )

  function update(categoryId: string, field: keyof RowValues, raw: string) {
    setValues((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: formatCurrencyInput(raw) }
    }))
  }

  function applySuggestion(
    categoryId: string,
    field: keyof RowValues,
    value: number
  ) {
    setValues((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: toInput(value) }
    }))
  }

  async function handleSave() {
    const rows = defaults.filter((row) => isChanged(row, values, initial))

    if (rows.length === 0) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }

    setIsPreparing(true)

    try {
      // Uma cotação por moeda estrangeira, do mês do fechamento
      const rates = new Map<string, number>([['BRL', 1]])

      for (const { category } of rows) {
        if (!rates.has(category.currency)) {
          rates.set(
            category.currency,
            await getCurrencyData(category.currency, { month, year })
          )
        }
      }

      const dtos: CreateBudgetDTO[] = rows.map(({ category }) => {
        const row = values[category.id]
        const isVariable = VARIABLE_TYPES.includes(category.type)

        return {
          categoryId: category.id,
          month,
          year,
          amount: parseValue(row.amount),
          exchangeRate: rates.get(category.currency) ?? 1,
          dividendAmount:
            isVariable && row.dividend ? parseValue(row.dividend) : null,
          contributionAmount: row.contribution
            ? parseValue(row.contribution)
            : null
        }
      })

      setIsPreparing(false)
      await saveClosing(dtos)
      onDone()
    } catch {
      // o erro já é exibido pelo toast do hook de mutation
    } finally {
      setIsPreparing(false)
    }
  }

  return (
    <>
      <div className="space-y-3 overflow-y-auto p-4">
        {defaults.map((row) => {
          const { category } = row
          const rowValues = values[category.id]
          const isVariable = VARIABLE_TYPES.includes(category.type)
          const amountValue = parseValue(rowValues.amount)
          const dividendValue = parseValue(rowValues.dividend)

          const showQuoteHint =
            row.quoteSuggestion != null &&
            Math.abs(row.quoteSuggestion - amountValue) >= 0.01
          const showDividendHint =
            isVariable &&
            row.dividendSuggestion != null &&
            Math.abs(row.dividendSuggestion - dividendValue) >= 0.01

          return (
            <div
              key={category.id}
              className="space-y-2.5 rounded-lg border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    CATEGORY_TYPE_BG[category.type] || 'bg-muted'
                  )}
                />
                <span className="font-semibold text-foreground text-xs">
                  {category.name}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'h-4 border-0 px-1.5 py-0 font-normal text-[10px]',
                    CATEGORY_TYPE_COLORS[category.type]
                  )}
                >
                  {CATEGORY_TYPE_LABELS[category.type] || category.type}
                </Badge>
                {row.amountSource && (
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {SOURCE_LABEL[row.amountSource]}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <ClosingField
                  id={`closing-amount-${category.id}`}
                  label={`Valor da posição (${category.currency})`}
                  value={rowValues.amount}
                  disabled={isSaving}
                  onChange={(raw) => update(category.id, 'amount', raw)}
                  hint={
                    showQuoteHint ? (
                      <SuggestionHint
                        label="Cotação atual"
                        value={formatCurrency(
                          row.quoteSuggestion as number,
                          category.currency
                        )}
                        onUse={() =>
                          applySuggestion(
                            category.id,
                            'amount',
                            row.quoteSuggestion as number
                          )
                        }
                      />
                    ) : null
                  }
                />

                {isVariable ? (
                  <ClosingField
                    id={`closing-dividend-${category.id}`}
                    label="Proventos no mês (R$)"
                    value={rowValues.dividend}
                    disabled={isSaving}
                    onChange={(raw) => update(category.id, 'dividend', raw)}
                    hint={
                      showDividendHint ? (
                        <SuggestionHint
                          label="Lançados"
                          value={formatCurrency(
                            row.dividendSuggestion as number
                          )}
                          onUse={() =>
                            applySuggestion(
                              category.id,
                              'dividend',
                              row.dividendSuggestion as number
                            )
                          }
                        />
                      ) : null
                    }
                  />
                ) : (
                  <div className="hidden sm:block" />
                )}

                <ClosingField
                  id={`closing-contribution-${category.id}`}
                  label="Aporte líquido (R$)"
                  value={rowValues.contribution}
                  disabled={isSaving}
                  onChange={(raw) => update(category.id, 'contribution', raw)}
                />
              </div>
            </div>
          )
        })}

        <div className="flex items-start gap-1.5 pt-1 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {quoteAvailable
              ? 'O valor sugerido soma as posições ativas pela cotação atual, então confira antes de salvar.'
              : 'Para meses mais antigos não há sugestão pela cotação: o valor parte do mês anterior.'}{' '}
            Os proventos sugeridos são os líquidos já lançados em Proventos.
            Categorias em outra moeda são convertidas pela cotação do mês ao
            salvar. Só as categorias alteradas são salvas.
          </span>
        </div>
      </div>

      <DialogFooter className="border-border/60 border-t p-4">
        <Button
          variant="ghost"
          onClick={onDone}
          disabled={isSaving}
          className="text-xs"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || pendingCount === 0}
          className="gap-1.5 text-xs"
        >
          {isSaving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Save className="size-3.5" />
          )}
          {pendingCount > 0
            ? `Salvar ${pendingCount} ${pendingCount === 1 ? 'categoria' : 'categorias'}`
            : 'Salvar'}
        </Button>
      </DialogFooter>
    </>
  )
}

/**
 * Precisa salvar quando há valor e: ainda não existe registro (os padrões
 * sugeridos contam) ou o usuário mudou algo no registro existente.
 */
function isChanged(
  row: ClosingRowDefaults,
  values: Record<string, RowValues>,
  initial: Record<string, RowValues>
) {
  const current = values[row.category.id]
  if (parseValue(current.amount) <= 0) return false
  if (!row.isSaved) return true

  const start = initial[row.category.id]
  return (
    current.amount !== start.amount ||
    current.dividend !== start.dividend ||
    current.contribution !== start.contribution
  )
}

interface ClosingFieldProps {
  id: string
  label: string
  value: string
  disabled: boolean
  onChange: (raw: string) => void
  hint?: React.ReactNode
}

function ClosingField({
  id,
  label,
  value,
  disabled,
  onChange,
  hint
}: ClosingFieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="font-medium text-[11px] text-muted-foreground"
      >
        {label}
      </label>
      <Input
        id={id}
        inputMode="numeric"
        placeholder="0,00"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 text-xs tabular-nums"
      />
      {hint}
    </div>
  )
}

function SuggestionHint({
  label,
  value,
  onUse
}: {
  label: string
  value: string
  onUse: () => void
}) {
  return (
    <button
      type="button"
      onClick={onUse}
      className="cursor-pointer text-left text-[11px] text-muted-foreground hover:text-primary"
    >
      {label}: <span className="font-medium tabular-nums">{value}</span> ·{' '}
      <span className="text-primary underline-offset-2 hover:underline">
        usar
      </span>
    </button>
  )
}
