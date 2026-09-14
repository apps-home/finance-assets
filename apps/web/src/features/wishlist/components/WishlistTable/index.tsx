'use client'

import {
	CheckCircle2,
	FileText,
	Pencil,
	Target,
	Trash2,
	TrendingUp
} from 'lucide-react'

import { CategoryType } from '@/features/categories/api/types'
import {
	CATEGORY_TYPE_COLORS,
	CATEGORY_TYPE_LABELS
} from '@/features/categories/utils'
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
import { CURRENCIES } from '@/shared/utils/currencies'
import { formatCurrency } from '@/shared/utils/format-currency'
import {
	calcPercentageChange,
	formatPercentage
} from '@/shared/utils/format-percentage'

import type { WishlistWithCategory } from '../../types/wishlist.types'

interface WishlistTableProps {
	items: WishlistWithCategory[]
	onEdit: (item: WishlistWithCategory) => void
	onDelete: (item: WishlistWithCategory) => void
	className?: string
}

export function WishlistTable({
	items,
	onEdit,
	onDelete,
	className
}: WishlistTableProps) {
	if (items.length === 0) {
		return null
	}

	return (
		<div
			data-slot="wishlist-table-wrapper"
			className={cn(
				'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
				className
			)}
		>
			<Table data-slot="wishlist-table">
				<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead className="w-55 font-semibold text-xs">Ativo</TableHead>
						<TableHead className="font-semibold text-xs">Categoria</TableHead>
						<TableHead className="text-right font-semibold text-xs">
							Cotação Atual
						</TableHead>
						<TableHead className="text-right font-semibold text-xs">
							Preço Alvo
						</TableHead>
						<TableHead className="text-center font-semibold text-xs">
							Status do Alvo
						</TableHead>
						<TableHead className="font-semibold text-xs">Anotações</TableHead>
						<TableHead className="w-20 text-right font-semibold text-xs">
							Ações
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((item) => {
						const { wishlist, category } = item
						const catType = category?.type || CategoryType.VARIABLE_BR
						const currency = category?.currency || CURRENCIES[catType] || 'BRL'

						const currentPrice = wishlist.currentClosePrice
						const lastMonthPrice = wishlist.lastMonthClosePrice
						const targetPrice = wishlist.targetPrice

						const hasMonthComparison =
							currentPrice != null &&
							lastMonthPrice != null &&
							lastMonthPrice !== 0
						const monthlyChange = hasMonthComparison
							? calcPercentageChange(currentPrice!, lastMonthPrice!)
							: null

						const hasTarget = targetPrice != null && targetPrice > 0
						const isAtOrBelowTarget =
							hasTarget && currentPrice != null && currentPrice <= targetPrice

						// Distância em % do preço atual para o alvo: ((currentPrice - targetPrice) / targetPrice) * 100
						const distancePercentage =
							hasTarget && currentPrice != null
								? ((currentPrice - targetPrice) / targetPrice) * 100
								: null

						return (
							<TableRow key={wishlist.id} className="transition-colors">
								<TableCell>
									<div className="flex items-center gap-2.5">
										<Badge
											variant="default"
											className="shrink-0 px-2 py-0.5 font-bold text-xs"
										>
											{wishlist.ticker}
										</Badge>
										<Tooltip>
											<TooltipTrigger
												render={
													<span className="truncate font-medium text-foreground text-xs">
														{wishlist.name}
													</span>
												}
											/>
											<TooltipContent>{wishlist.name}</TooltipContent>
										</Tooltip>
									</div>
								</TableCell>

								<TableCell>
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-foreground text-xs">
											{category?.name || '—'}
										</span>
										<Badge
											variant="secondary"
											className={cn(
												'w-fit border-0 px-1.5 py-0 text-[10px]',
												CATEGORY_TYPE_COLORS[catType]
											)}
										>
											{CATEGORY_TYPE_LABELS[catType] || catType}
										</Badge>
									</div>
								</TableCell>

								<TableCell className="text-right text-xs tabular-nums">
									{currentPrice != null ? (
										<div className="flex flex-col items-end">
											<span className="font-semibold text-foreground">
												{formatCurrency(currentPrice, currency)}
											</span>
											{monthlyChange !== null && (
												<span
													className={cn(
														'font-medium text-[10px]',
														monthlyChange >= 0
															? 'text-emerald-600 dark:text-emerald-400'
															: 'text-red-600 dark:text-red-400'
													)}
												>
													{formatPercentage(monthlyChange)} no mês
												</span>
											)}
										</div>
									) : (
										<span className="text-muted-foreground/60 italic">—</span>
									)}
								</TableCell>

								<TableCell className="text-right font-medium text-foreground text-xs tabular-nums">
									{targetPrice != null ? (
										formatCurrency(targetPrice, currency)
									) : (
										<span className="text-muted-foreground/60 italic">—</span>
									)}
								</TableCell>

								<TableCell className="text-center">
									{hasTarget && currentPrice != null ? (
										isAtOrBelowTarget ? (
											<Badge
												variant="secondary"
												className="gap-1 border-0 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
											>
												<CheckCircle2 className="size-2.5" />
												No Preço{' '}
												{distancePercentage !== null && (
													<span className="tabular-nums">
														({formatPercentage(distancePercentage)})
													</span>
												)}
											</Badge>
										) : (
											<Badge
												variant="secondary"
												className="gap-1 border-0 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400"
											>
												<TrendingUp className="size-2.5" />
												Acima{' '}
												{distancePercentage !== null && (
													<span className="tabular-nums">
														(+{formatPercentage(distancePercentage)})
													</span>
												)}
											</Badge>
										)
									) : hasTarget ? (
										<Badge
											variant="secondary"
											className="gap-1 border-0 bg-muted text-[10px] text-muted-foreground"
										>
											<Target className="size-2.5" />
											Aguardando cotação
										</Badge>
									) : (
										<Badge
											variant="secondary"
											className="border-0 bg-muted text-[10px] text-muted-foreground"
										>
											Sem meta
										</Badge>
									)}
								</TableCell>

								<TableCell>
									{wishlist.notes ? (
										<Tooltip>
											<TooltipTrigger
												render={
													<div className="flex max-w-xs items-center gap-1.5 text-muted-foreground text-xs">
														<FileText className="size-3.5 shrink-0 text-muted-foreground" />
														<span className="truncate">{wishlist.notes}</span>
													</div>
												}
											/>
											<TooltipContent className="max-w-xs text-xs">
												{wishlist.notes}
											</TooltipContent>
										</Tooltip>
									) : (
										<span className="text-muted-foreground/40 text-xs">—</span>
									)}
								</TableCell>

								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														variant="ghost"
														size="icon"
														className="size-7"
														onClick={() => onEdit(item)}
													>
														<Pencil className="size-3.5 text-muted-foreground" />
													</Button>
												}
											/>
											<TooltipContent>Editar Item</TooltipContent>
										</Tooltip>
										<Tooltip>
											<TooltipTrigger
												render={
													<Button
														variant="ghost"
														size="icon"
														className="size-7 text-destructive hover:text-destructive/80"
														onClick={() => onDelete(item)}
													>
														<Trash2 className="size-3.5" />
													</Button>
												}
											/>
											<TooltipContent>Remover da Wishlist</TooltipContent>
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
