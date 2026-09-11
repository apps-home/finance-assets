'use client'

import { Coins, Edit, Loader2, Save, TrendingUp, X } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import type { MonthData } from '@/app/(application)/(dashboard)/page'
import { Category, CategoryType } from '@/features/categories/api/types'
import type { CreateBudgetDTO } from '@/infrastructure/api/budgets/types'
import { getCurrencyData } from '@/infrastructure/services/external/get-currency'
import { Button } from '@/shared/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/shared/components/ui/popover'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { parseValue } from '@/shared/utils/parse-value'

const VARIABLE_TYPES: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.VARIABLE_US,
  CategoryType.CRYPTO
]

interface FinancialTableProps {
  data: MonthData[]
  categories: Category[]
  year: number
  onSaveCell: (dto: CreateBudgetDTO) => Promise<void>
}

export function FinancialTable({
  data,
  categories,
  year,
  onSaveCell
}: FinancialTableProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number
    col: string
  } | null>(null)

  const [tempValue, setTempValue] = useState('')
  const [tempDividend, setTempDividend] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (
    rowIndex: number,
    columnName: string,
    currentValue: number,
    currentDividend?: number
  ) => {
    setEditingCell({ row: rowIndex, col: columnName })

    const centavos = Math.round(currentValue * 100).toString()
    setTempValue(formatCurrencyInput(centavos))
    if (currentDividend && currentDividend > 0) {
      const dividendCentavos = Math.round(currentDividend * 100).toString()
      setTempDividend(formatCurrencyInput(dividendCentavos))
    } else {
      setTempDividend('')
    }
  }

  const handleSave = async () => {
    if (!editingCell) return

    const category = categories.find((c) => c.name === editingCell.col)

    if (!category) {
      console.error('Categoria não encontrada para a coluna:', editingCell.col)
      return
    }

    const amount = parseValue(tempValue)
    const monthIndex = editingCell.row + 1

    const exchangeRate =
      category.currency === 'BRL'
        ? 1
        : await getCurrencyData(category.currency, {
            month: monthIndex,
            year: year
          })

    const isVariable = VARIABLE_TYPES.includes(category.type)
    const dividendAmount =
      isVariable && tempDividend ? parseValue(tempDividend) : null

    const dto: CreateBudgetDTO = {
      categoryId: category.id,
      month: monthIndex,
      year: year,
      amount: amount,
      exchangeRate: exchangeRate,
      dividendAmount: dividendAmount
    }

    try {
      setIsSaving(true)

      await onSaveCell(dto)

      setEditingCell(null)
      setTempValue('')
      setTempDividend('')
    } catch (error) {
      console.error('Erro ao salvar', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
    setTempValue('')
    setTempDividend('')
  }

  const calculateTotal = useCallback((row: MonthData) => {
    return Object.keys(row).reduce((acc, key) => {
      if (
        key === 'month' ||
        key === 'monthIndex' ||
        key === 'id' ||
        key.endsWith('_dividend')
      )
        return acc
      const value = row[key]
      return acc + (typeof value === 'number' ? value : 0)
    }, 0)
  }, [])

  const summaryStats = useMemo(() => {
    if (!data.length || !categories.length) {
      return {
        categories: {} as Record<
          string,
          {
            totalDividends: number
            initialValue: number
            finalValue: number
            growthDiff: number
            growthPercentage: number | null
            yieldPercentage: number
            monthlyYieldPercentage: number
          }
        >,
        overall: {
          totalDividends: 0,
          growthDiff: 0,
          growthPercentage: null as number | null,
          yieldPercentage: 0
        }
      }
    }

    const categoryStats: Record<
      string,
      {
        totalDividends: number
        initialValue: number
        finalValue: number
        growthDiff: number
        growthPercentage: number | null
        yieldPercentage: number
        monthlyYieldPercentage: number
      }
    > = {}

    let overallTotalDividends = 0

    categories.forEach((cat) => {
      let totalDividends = 0
      let initialValue: number | null = null
      let finalValue: number | null = null
      let activeMonthsCount = 0
      let totalMonthlyYield = 0

      data.forEach((row) => {
        const val =
          typeof row[cat.name] === 'number' ? (row[cat.name] as number) : 0
        const divVal =
          typeof row[`${cat.name}_dividend`] === 'number'
            ? (row[`${cat.name}_dividend`] as number)
            : 0

        totalDividends += divVal

        if (val > 0) {
          activeMonthsCount += 1
          if (divVal > 0) {
            totalMonthlyYield += (divVal / val) * 100
          }
          if (initialValue === null) {
            initialValue = val
          }
          finalValue = val
        }
      })

      overallTotalDividends += totalDividends

      const resolvedInitial = initialValue ?? 0
      const resolvedFinal = finalValue ?? 0
      const growthDiff = resolvedFinal - resolvedInitial
      const growthPercentage =
        resolvedInitial > 0
          ? (growthDiff / resolvedInitial) * 100
          : resolvedFinal > 0
            ? 100
            : null

      const yieldPercentage =
        resolvedFinal > 0 ? (totalDividends / resolvedFinal) * 100 : 0

      const monthlyYieldPercentage =
        activeMonthsCount > 0 ? totalMonthlyYield / activeMonthsCount : 0

      categoryStats[cat.name] = {
        totalDividends,
        initialValue: resolvedInitial,
        finalValue: resolvedFinal,
        growthDiff,
        growthPercentage,
        yieldPercentage,
        monthlyYieldPercentage
      }
    })

    let overallInitial: number | null = null
    let overallFinal: number | null = null

    data.forEach((row) => {
      const total = calculateTotal(row)
      if (total > 0) {
        if (overallInitial === null) {
          overallInitial = total
        }
        overallFinal = total
      }
    })

    const resolvedOverallInitial = overallInitial ?? 0
    const resolvedOverallFinal = overallFinal ?? 0
    const overallGrowthDiff = resolvedOverallFinal - resolvedOverallInitial
    const overallGrowthPercentage =
      resolvedOverallInitial > 0
        ? (overallGrowthDiff / resolvedOverallInitial) * 100
        : resolvedOverallFinal > 0
          ? 100
          : null

    const overallYieldPercentage =
      resolvedOverallFinal > 0
        ? (overallTotalDividends / resolvedOverallFinal) * 100
        : 0

    return {
      categories: categoryStats,
      overall: {
        totalDividends: overallTotalDividends,
        growthDiff: overallGrowthDiff,
        growthPercentage: overallGrowthPercentage,
        yieldPercentage: overallYieldPercentage
      }
    }
  }, [data, categories, calculateTotal])

  const { currentYear, currentMonthIndex } = useMemo(() => {
    const now = new Date()
    return {
      currentYear: now.getFullYear(),
      currentMonthIndex: now.getMonth()
    }
  }, [])

  const renderCell = (
    rowIndex: number,
    columnName: string,
    value: unknown,
    dividendValue?: number
  ) => {
    const numericValue = typeof value === 'number' ? value : 0
    const isEditing =
      editingCell?.row === rowIndex && editingCell?.col === columnName

    const category = categories.find((c) => c.name === columnName)
    const isVariable = category ? VARIABLE_TYPES.includes(category.type) : false

    return (
      <Popover
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) handleCancel()
        }}
      >
        <PopoverTrigger
          onClick={() =>
            handleEdit(rowIndex, columnName, numericValue, dividendValue)
          }
          className="group relative -m-1.5 flex w-full cursor-pointer items-center justify-end rounded-md p-1.5 pr-8 transition-colors hover:bg-muted/80 focus:outline-none"
        >
          <div className="flex flex-col items-end text-right">
            {numericValue > 0 ? (
              <p className="font-medium text-foreground/80 text-sm tabular-nums">
                {formatCurrency(numericValue)}
              </p>
            ) : (
              <span className="font-mono text-muted-foreground/30 text-xs">
                —
              </span>
            )}
            {dividendValue && dividendValue > 0 ? (
              <span className="mt-0.5 inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono font-semibold text-emerald-400 text-xs">
                Dividendos: {formatCurrency(dividendValue)}
              </span>
            ) : null}
          </div>
          <span
            className="absolute right-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
            title="Editar valor"
          >
            <Edit className="size-3.5" />
          </span>
        </PopoverTrigger>

        {isEditing && (
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            className="w-72 space-y-3 p-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-border/60 border-b pb-2">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-xs">
                  {columnName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {data[rowIndex]?.month} de {year}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="size-6 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label
                  htmlFor={`val-${rowIndex}-${columnName}`}
                  className="font-medium text-[11px] text-muted-foreground"
                >
                  Saldo / Valor da Posição:
                </label>
                <input
                  id={`val-${rowIndex}-${columnName}`}
                  type="text"
                  value={tempValue}
                  autoFocus
                  disabled={isSaving}
                  onChange={(e) =>
                    setTempValue(formatCurrencyInput(e.target.value))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="R$ 0,00"
                />
              </div>

              {isVariable && (
                <div className="space-y-1">
                  <label
                    htmlFor={`div-${rowIndex}-${columnName}`}
                    className="font-medium text-[11px] text-muted-foreground"
                  >
                    Dividendos Recebidos no Mês:
                  </label>
                  <input
                    id={`div-${rowIndex}-${columnName}`}
                    type="text"
                    value={tempDividend}
                    disabled={isSaving}
                    onChange={(e) =>
                      setTempDividend(formatCurrencyInput(e.target.value))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave()
                      if (e.key === 'Escape') handleCancel()
                    }}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 font-mono text-foreground text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="R$ 0,00"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-7 px-2.5 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-7 gap-1.5 px-3 text-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-border border-b bg-muted/20 text-xs">
          <tr>
            <th className="sticky left-0 z-10 bg-card px-4 py-3.5 text-left font-semibold text-muted-foreground uppercase tracking-wider shadow-[1px_0_0_0_var(--border)]">
              Mês
            </th>
            {categories.map((cat) => (
              <th
                key={cat.id}
                className="px-4 py-3.5 pr-8 text-right font-semibold text-muted-foreground"
              >
                {cat.name}
              </th>
            ))}
            <th className="border-border/60 border-l bg-muted/10 px-4 py-3.5 text-right font-semibold text-primary uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowTotal = calculateTotal(row)
            const isZeroMonth = rowTotal === 0
            const isCurrentMonth =
              year === currentYear && index === currentMonthIndex

            return (
              <tr
                key={row.month}
                className={`border-border/60 border-b transition-colors ${
                  isCurrentMonth
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : isZeroMonth
                      ? 'opacity-40 hover:bg-muted/30 hover:opacity-100'
                      : 'hover:bg-muted/40'
                }`}
              >
                <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3.5 font-semibold text-foreground text-xs shadow-[1px_0_0_0_var(--border)]">
                  <div className="flex items-center gap-2">
                    <span>{row.month}</span>
                    {isCurrentMonth && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 font-semibold text-[10px] text-primary">
                        Atual
                      </span>
                    )}
                  </div>
                </td>
                {categories.map((cat) => {
                  const dividendVal =
                    typeof row[`${cat.name}_dividend`] === 'number'
                      ? (row[`${cat.name}_dividend`] as number)
                      : undefined

                  return (
                    <td
                      key={`${row.month}-${cat.id}`}
                      className="px-4 py-4 text-right text-muted-foreground"
                    >
                      {renderCell(index, cat.name, row[cat.name], dividendVal)}
                    </td>
                  )
                })}
                <td className="border-border/60 border-l bg-muted/10 px-4 py-3.5 text-right text-xs">
                  {rowTotal > 0 ? (
                    <span className="font-bold text-primary text-sm tabular-nums">
                      {formatCurrency(rowTotal)}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground/30 text-xs">
                      —
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot className="border-primary/30 border-t-2 bg-muted/30 font-medium">
          <tr className="border-border/60 border-b">
            <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3.5 text-left shadow-[1px_0_0_0_var(--border)]">
              <div className="flex items-center gap-2">
                <div className="rounded bg-primary/10 p-1">
                  <Coins className="size-3.5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-xs">
                  Dividendos Anuais
                </span>
              </div>
            </td>
            {categories.map((cat) => {
              const catStat = summaryStats.categories[cat.name]
              const hasDividends = catStat && catStat.totalDividends > 0

              return (
                <td
                  key={`foot-div-${cat.id}`}
                  className="px-4 py-3.5 pr-8 text-right text-xs"
                >
                  {hasDividends ? (
                    <div className="flex flex-col items-end text-right">
                      <span className="font-bold font-mono text-primary text-sm tabular-nums">
                        {formatCurrency(catStat.totalDividends)}
                      </span>
                      {catStat.yieldPercentage > 0 && (
                        <span className="mt-0.5 inline-flex items-center whitespace-nowrap rounded bg-primary/10 px-1.5 py-0.5 font-medium font-mono text-primary text-xs">
                          DY: {catStat.yieldPercentage.toFixed(2)}% a.a. •{' '}
                          {catStat.monthlyYieldPercentage.toFixed(2)}% a.m.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <span className="text-muted-foreground/40 text-xs">
                        —
                      </span>
                    </div>
                  )}
                </td>
              )
            })}
            <td className="border-border/60 border-l bg-muted/10 px-4 py-3.5 text-right text-[13px]">
              <span className="font-bold font-mono text-[13px] text-primary">
                {formatCurrency(summaryStats.overall.totalDividends)}
              </span>
            </td>
          </tr>
          <tr>
            <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-3.5 text-left shadow-[1px_0_0_0_var(--border)]">
              <div className="flex items-center gap-2">
                <div className="rounded bg-primary/10 p-1">
                  <TrendingUp className="size-3.5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-xs">
                  Crescimento no Ano
                </span>
              </div>
            </td>
            {categories.map((cat) => {
              const catStat = summaryStats.categories[cat.name]
              if (
                !catStat ||
                (catStat.initialValue === 0 && catStat.finalValue === 0)
              ) {
                return (
                  <td
                    key={`foot-growth-${cat.id}`}
                    className="px-4 py-3.5 pr-8 text-right text-muted-foreground/40 text-xs"
                  >
                    <div className="flex justify-end">
                      <span>—</span>
                    </div>
                  </td>
                )
              }

              const isPositive = catStat.growthDiff >= 0

              return (
                <td
                  key={`foot-growth-${cat.id}`}
                  className="px-4 py-3.5 pr-8 text-right text-xs"
                >
                  <div className="flex flex-col items-end text-right">
                    <span
                      className={`font-semibold text-sm tabular-nums ${
                        isPositive ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {formatCurrency(catStat.growthDiff)}
                    </span>
                    {catStat.growthPercentage !== null && (
                      <span
                        className={`mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 font-medium font-mono text-xs ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {catStat.growthPercentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </td>
              )
            })}
            <td className="border-border/60 border-l bg-muted/10 px-4 py-3.5 text-right text-sm">
              <div className="flex flex-col items-end text-right">
                <span
                  className={`font-bold font-mono text-sm ${
                    summaryStats.overall.growthDiff >= 0
                      ? 'text-primary'
                      : 'text-destructive'
                  }`}
                >
                  {summaryStats.overall.growthDiff >= 0 ? '+' : ''}
                  {formatCurrency(summaryStats.overall.growthDiff)}
                </span>
                {summaryStats.overall.growthPercentage !== null && (
                  <span
                    className={`mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 font-medium font-mono text-xs ${
                      summaryStats.overall.growthDiff >= 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {summaryStats.overall.growthPercentage >= 0 ? '+' : ''}
                    {summaryStats.overall.growthPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
