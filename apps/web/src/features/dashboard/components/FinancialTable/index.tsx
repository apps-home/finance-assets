'use client'

import { Edit, Loader2, Save, X } from 'lucide-react'
import { useState } from 'react'

import type { MonthData } from '@/app/(application)/(dashboard)/page'
import type { Category } from '@/features/categories/api/types'
import type { CreateBudgetDTO } from '@/infrastructure/api/budgets/types'
import { getCurrencyData } from '@/infrastructure/services/external/get-currency'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency } from '@/shared/utils/format-currency'

import { formatCurrencyInput } from '../../utils/format-currency-input'
import { parseValue } from '../../utils/parse-value'

const VARIABLE_TYPES = ['VARIABLE_BR', 'VARIABLE_US', 'CRYPTO']

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

	const calculateTotal = (row: MonthData) => {
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
	}

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

		if (isEditing) {
			return (
				<div className="space-y-1.5">
					<div className="flex items-center gap-2">
						<input
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
							className="w-full rounded border border-primary bg-input px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
						/>
						<Button
							onClick={handleSave}
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-primary hover:text-primary/80"
						>
							{isSaving ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Save className="size-4" />
							)}
						</Button>
						<Button
							onClick={handleCancel}
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-destructive hover:text-destructive/80"
						>
							<X className="size-4" />
						</Button>
					</div>
					{isVariable && (
						<div className="flex items-center gap-2">
							<span className="shrink-0 text-muted-foreground text-xs">
								Dividendos:
							</span>
							<input
								type="text"
								value={tempDividend}
								placeholder="0,00"
								disabled={isSaving}
								onChange={(e) =>
									setTempDividend(formatCurrencyInput(e.target.value))
								}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSave()
									if (e.key === 'Escape') handleCancel()
								}}
								className="w-full rounded border border-primary/60 bg-input px-2 py-1 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/60"
							/>
						</div>
					)}
				</div>
			)
		}

		return (
			<div
				className="group flex items-center justify-between"
				onClick={() =>
					handleEdit(rowIndex, columnName, numericValue, dividendValue)
				}
			>
				<div className="flex flex-col">
					<p>{formatCurrency(numericValue)}</p>
					{dividendValue && dividendValue > 0 ? (
						<p className="text-muted-foreground text-xs">
							Dividendos: {formatCurrency(dividendValue)}
						</p>
					) : null}
				</div>
				<Button
					onClick={() =>
						handleEdit(rowIndex, columnName, numericValue, dividendValue)
					}
					variant="ghost"
					size="icon"
					className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
				>
					<Edit className="size-4" />
				</Button>
			</div>
		)
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-border border-b">
						<th className="px-4 py-4 text-left text-muted-foreground">Mês</th>
						{categories.map((cat) => (
							<th
								key={cat.id}
								className="px-4 py-4 text-left font-medium text-muted-foreground"
							>
								{cat.name}
							</th>
						))}
						<th className="px-4 py-4 text-right text-primary">Total</th>
					</tr>
				</thead>
				<tbody>
					{data.map((row, index) => (
						<tr
							key={row.month}
							className="border-border border-b transition-colors hover:bg-muted/50"
						>
							<td className="px-4 py-4 text-foreground">{row.month}</td>
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
							<td className="px-4 py-4 text-right font-medium text-primary">
								{formatCurrency(calculateTotal(row))}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}
