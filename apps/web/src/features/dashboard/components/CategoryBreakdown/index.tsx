import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { Badge } from '@/shared/components/ui/badge'
import { formatCurrency } from '@/shared/utils/format-currency'

interface CategoryData {
	name: string
	value: number
	color: string
}

interface CategoryBreakdownProps {
	data: CategoryData[]
	subtitle?: string
}

interface CustomTooltipProps {
	active?: boolean
	payload?: Array<{
		name: string
		value: number
		payload: CategoryData & { percent?: number }
	}>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null

	const data = payload[0]
	const total = data.payload.percent ? data.value / data.payload.percent : 0
	const percent = total > 0 ? (data.value / total) * 100 : 0

	return (
		<div
			className="rounded-xl border border-border/50 bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm"
			style={{
				boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
			}}
		>
			<div className="mb-2 flex items-center gap-2.5">
				<div
					className="size-3 rounded-full ring-2 ring-white/20"
					style={{ backgroundColor: data.payload.color }}
				/>
				<span className="font-semibold text-popover-foreground text-sm">
					{data.name}
				</span>
			</div>
			<div className="space-y-1">
				<div className="font-bold text-lg text-primary">
					{formatCurrency(data.value)}
				</div>
				<div className="text-muted-foreground text-xs">
					{percent.toFixed(1)}% do total
				</div>
			</div>
		</div>
	)
}

export function CategoryBreakdown({ data, subtitle }: CategoryBreakdownProps) {
	const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

	const total = data.reduce((sum, item) => sum + item.value, 0)

	const onPieEnter = (_: unknown, index: number) => {
		setActiveIndex(index)
	}

	const onPieLeave = () => {
		setActiveIndex(undefined)
	}

	return (
		<div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
			<div className="mb-2 flex items-center gap-4">
				<h3 className="font-semibold text-xl">Distribuição por Categoria</h3>
				{subtitle && (
					<Badge className="bg-primary/10 text-primary text-xs">
						{subtitle}
					</Badge>
				)}
			</div>

			<div className="flex flex-col gap-4 lg:flex-row">
				<div className="flex-1">
					<ResponsiveContainer width="100%" height={260}>
						<PieChart>
							<Pie
								data={data.map((item, idx) => ({
									...item,
									percent: item.value / total,
									isActive: activeIndex === idx
								}))}
								cx="50%"
								cy="50%"
								labelLine={false}
								innerRadius={50}
								outerRadius={95}
								paddingAngle={2}
								dataKey="value"
								onMouseEnter={onPieEnter}
								onMouseLeave={onPieLeave}
								animationBegin={0}
								animationDuration={800}
								animationEasing="ease-out"
							>
								{data.map((entry, index) => (
									<Cell
										key={entry.name}
										fill={entry.color}
										stroke={
											activeIndex === index ? 'var(--primary)' : 'transparent'
										}
										strokeWidth={activeIndex === index ? 3 : 0}
										style={{
											cursor: 'pointer',
											filter:
												activeIndex === index ? 'brightness(1.1)' : 'none',
											transition: 'all 0.2s ease-out'
										}}
									/>
								))}
							</Pie>
							<Tooltip
								content={<CustomTooltip />}
								wrapperStyle={{ outline: 'none' }}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>

				<div className="flex flex-col justify-center gap-2 lg:min-w-45">
					{data.map((item, index) => {
						const percent = ((item.value / total || 0) * 100).toFixed(1)
						const isActive = activeIndex === index

						return (
							<button
								type="button"
								key={item.name}
								className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-200 ${isActive ? 'scale-[1.02] bg-accent/50' : 'hover:bg-accent/30'}`}
								onMouseEnter={() => setActiveIndex(index)}
								onMouseLeave={() => setActiveIndex(undefined)}
								onFocus={() => setActiveIndex(index)}
								onBlur={() => setActiveIndex(undefined)}
							>
								<div
									className={`size-3 rounded-full transition-transform duration-200${isActive ? 'scale-125' : ''}
									`}
									style={{ backgroundColor: item.color }}
								/>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-foreground text-sm">
										{item.name}
									</p>
								</div>
								<span
									className={`font-semibold text-xs tabular-nums transition-colors duration-200${isActive ? 'text-primary' : 'text-muted-foreground'}
								`}
								>
									{percent}%
								</span>
							</button>
						)
					})}
				</div>
			</div>

			<div className="mt-4 flex items-center justify-between border-border/50 border-t pt-4">
				<span className="text-muted-foreground text-sm">Total</span>
				<span className="font-bold text-lg text-primary">
					{formatCurrency(total)}
				</span>
			</div>
		</div>
	)
}
