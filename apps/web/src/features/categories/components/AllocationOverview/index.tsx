'use client'

import { Target } from 'lucide-react'

import type { Category } from '@/features/categories/api/types'
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'

interface AllocationOverviewProps {
	categories: Category[]
}

const TYPE_COLORS: Record<string, string> = {
	FIXED: 'bg-emerald-500',
	VARIABLE_BR: 'bg-blue-500',
	VARIABLE_US: 'bg-violet-500',
	CRYPTO: 'bg-amber-500'
}

const TYPE_LABELS: Record<string, string> = {
	FIXED: 'Renda Fixa',
	VARIABLE_BR: 'Ações BR',
	VARIABLE_US: 'Ações EUA',
	CRYPTO: 'Cripto'
}

export function AllocationOverview({ categories }: AllocationOverviewProps) {
	const categoriesWithTarget = categories.filter(
		(c) => c.targetPercentage != null && c.targetPercentage > 0
	)

	if (categoriesWithTarget.length === 0) {
		return null
	}

	const totalTarget = categoriesWithTarget.reduce(
		(sum, c) => sum + (c.targetPercentage || 0),
		0
	)

	const isOverAllocated = totalTarget > 100

	return (
		<Card data-slot="allocation-overview">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<Target className="size-5 text-primary" />
					<CardTitle className="text-base">Metas de Alocação</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{isOverAllocated && (
					<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
						<p className="font-medium text-amber-600 text-xs dark:text-amber-400">
							⚠ Soma das metas ({totalTarget.toFixed(1)}%) excede 100%. Ajuste
							suas metas para manter o equilíbrio.
						</p>
					</div>
				)}

				<div className="space-y-3">
					{categoriesWithTarget.map((category) => {
						const target = category.targetPercentage || 0

						return (
							<div key={category.id} className="space-y-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className={cn(
												'size-2.5 rounded-full',
												TYPE_COLORS[category.type] || 'bg-muted'
											)}
										/>
										<span className="font-medium text-foreground text-sm">
											{category.name}
										</span>
										<span className="text-muted-foreground text-xs">
											{TYPE_LABELS[category.type]}
										</span>
									</div>
									<span className="font-semibold text-foreground text-sm tabular-nums">
										{target.toFixed(1)}%
									</span>
								</div>

								<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
									<div
										className={cn(
											'h-full rounded-full transition-all duration-500',
											TYPE_COLORS[category.type] || 'bg-primary'
										)}
										style={{ width: `${Math.min(target, 100)}%` }}
									/>
								</div>
							</div>
						)
					})}
				</div>

				<div className="flex items-center justify-between border-border border-t pt-3">
					<span className="font-medium text-muted-foreground text-xs">
						Total alocado
					</span>
					<span
						className={cn(
							'font-bold text-sm tabular-nums',
							isOverAllocated
								? 'text-amber-600 dark:text-amber-400'
								: 'text-primary'
						)}
					>
						{totalTarget.toFixed(1)}%
					</span>
				</div>

				{!isOverAllocated && totalTarget < 100 && (
					<div className="rounded-lg bg-muted/50 px-3 py-2">
						<p className="text-muted-foreground text-xs">
							{(100 - totalTarget).toFixed(1)}% ainda não alocado. Configure
							metas em suas categorias para completar o plano.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
