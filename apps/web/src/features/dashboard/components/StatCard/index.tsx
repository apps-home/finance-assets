import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/utils/format-currency'

interface StatCardProps {
	title: string
	value: number
	icon: LucideIcon
	trend?: string
	trendUp?: boolean
	subtitle?: string
}

export function StatCard({
	title,
	value,
	icon: Icon,
	trend,
	trendUp,
	subtitle
}: StatCardProps) {
	return (
		<div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-300 hover:border-primary/30">
			<div className="mb-4 flex items-center justify-between">
				<div className="rounded-lg bg-primary/10 p-3">
					<Icon className="size-6 text-primary" />
				</div>
				{trend && (
					<div
						className={`text-sm ${trendUp ? 'text-primary' : 'text-destructive'}`}
					>
						{trend}
					</div>
				)}
			</div>
			<div className="mb-1 flex items-center gap-2">
				<span className="text-muted-foreground text-sm">{title}</span>
				{subtitle && (
					<Badge className="bg-primary/10 text-primary text-xs">
						{subtitle}
					</Badge>
				)}
			</div>
			<div className="font-bold text-2xl">{formatCurrency(value)}</div>
		</div>
	)
}
