'use client'

import {
	CheckCircle2,
	FileText,
	Pencil,
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
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
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

interface WishlistCardProps {
	item: WishlistWithCategory
	onEdit: (item: WishlistWithCategory) => void
	onDelete: (item: WishlistWithCategory) => void
	className?: string
}

export function WishlistCard({
	item,
	onEdit,
	onDelete,
	className
}: WishlistCardProps) {
	const { wishlist, category } = item
	const catType = category?.type || CategoryType.VARIABLE_BR
	const currency = category?.currency || CURRENCIES[catType] || 'BRL'

	const currentPrice = wishlist.currentClosePrice
	const lastMonthPrice = wishlist.lastMonthClosePrice
	const targetPrice = wishlist.targetPrice

	const hasMonthComparison =
		currentPrice != null && lastMonthPrice != null && lastMonthPrice !== 0
	const monthlyChange = hasMonthComparison
		? calcPercentageChange(currentPrice!, lastMonthPrice!)
		: null

	const hasTarget = targetPrice != null && targetPrice > 0
	const isAtOrBelowTarget =
		hasTarget && currentPrice != null && currentPrice <= targetPrice
	const isAboveTarget =
		hasTarget && currentPrice != null && currentPrice > targetPrice

	const distancePercentage =
		hasTarget && currentPrice != null
			? ((currentPrice - targetPrice) / targetPrice) * 100
			: null

	return (
		<Card
			data-slot="wishlist-card"
			className={cn(
				'flex flex-col border-border transition-shadow hover:shadow-md',
				className
			)}
		>
			<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
				<div className="flex items-center gap-2.5">
					<Badge
						variant="default"
						className="shrink-0 px-2 py-0.5 font-bold text-xs"
					>
						{wishlist.ticker}
					</Badge>
					<div>
						<Tooltip>
							<TooltipTrigger
								render={
									<h3 className="truncate font-semibold text-foreground text-sm">
										{wishlist.name}
									</h3>
								}
							/>
							<TooltipContent>{wishlist.name}</TooltipContent>
						</Tooltip>
						<div className="mt-1 flex flex-wrap items-center gap-1.5">
							<span className="font-medium text-muted-foreground text-xs">
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
					</div>
				</div>

				<div className="flex items-center gap-1">
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
			</CardHeader>

			<CardContent className="flex flex-1 flex-col justify-between gap-4 pt-1">
				<div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/20 p-3">
					<div className="space-y-0.5">
						<span className="text-muted-foreground/60 text-xs">
							Cotação Atual
						</span>
						<p className="font-semibold text-foreground text-sm tabular-nums">
							{currentPrice != null ? (
								formatCurrency(currentPrice, currency)
							) : (
								<span className="text-muted-foreground/60 italic font-normal text-xs">
									Aguardando...
								</span>
							)}
						</p>
						{monthlyChange !== null && (
							<p
								className={cn(
									'font-medium text-[10px] tabular-nums',
									monthlyChange >= 0
										? 'text-emerald-600 dark:text-emerald-400'
										: 'text-red-600 dark:text-red-400'
								)}
							>
								{formatPercentage(monthlyChange)} no mês
							</p>
						)}
					</div>

					<div className="space-y-0.5">
						<span className="text-muted-foreground/60 text-xs">
							Preço Alvo
						</span>
						<p className="font-semibold text-foreground text-sm tabular-nums">
							{targetPrice != null ? (
								formatCurrency(targetPrice, currency)
							) : (
								<span className="text-muted-foreground/60 italic font-normal text-xs">
									Não definido
								</span>
							)}
						</p>
						{hasTarget && (
							<div className="pt-0.5">
								{isAtOrBelowTarget ? (
									<Badge
										variant="secondary"
										className="gap-1 border-0 bg-emerald-500/10 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
									>
										<CheckCircle2 className="size-2.5" />
										No Preço
									</Badge>
								) : isAboveTarget ? (
									<Badge
										variant="secondary"
										className="gap-1 border-0 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600 dark:text-amber-400"
									>
										<TrendingUp className="size-2.5" />
										Acima (+
										{distancePercentage !== null &&
											formatPercentage(distancePercentage)}
										)
									</Badge>
								) : null}
							</div>
						)}
					</div>
				</div>

				{wishlist.notes && (
					<>
						<Separator />
						<div className="flex items-start gap-1.5 text-muted-foreground text-xs">
							<FileText className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
							<p className="line-clamp-2">{wishlist.notes}</p>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
