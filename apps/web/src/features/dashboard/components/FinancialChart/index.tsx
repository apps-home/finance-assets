'use client'

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis
} from 'recharts'

import { formatCurrency } from '@/shared/utils/format-currency'

interface ChartData {
	month: string
	total: number
	[key: string]: string | number
}

interface FinancialChartProps {
	data: ChartData[]
}

interface CustomTooltipProps {
	active?: boolean
	payload?: Array<{
		value: number
		dataKey: string
		payload: ChartData
	}>
	label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
	if (!active || !payload || payload.length === 0) return null

	const data = payload[0]

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
					style={{ backgroundColor: 'var(--primary)' }}
				/>
				<span className="font-semibold text-popover-foreground text-sm">
					{label}
				</span>
			</div>
			<div className="space-y-1">
				<div className="font-bold text-lg text-primary">
					{formatCurrency(data.value)}
				</div>
				<div className="text-muted-foreground text-xs">Patrimônio Total</div>
			</div>
		</div>
	)
}

export function FinancialChart({ data }: FinancialChartProps) {
	if (!data || data.length === 0) return null

	const monthsWithData = data.filter((item) => item.total > 0)
	const firstMonth = monthsWithData[0] ?? data[0]
	const lastMonth =
		monthsWithData[monthsWithData.length - 1] ?? data[data.length - 1]

	const firstValue = firstMonth?.total ?? 0
	const lastValue = lastMonth?.total ?? 0

	const growth =
		firstValue > 0
			? ((lastValue - firstValue) / firstValue) * 100
			: lastValue > 0
				? 100
				: 0

	const isPositiveGrowth = growth >= 0

	return (
		<div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="font-semibold text-xl">Evolução Patrimonial</h3>
				<div className="flex items-center gap-2">
					<span className="font-semibold text-muted-foreground text-sm">
						{firstMonth?.month} a {lastMonth?.month}
					</span>
					<span
						className={`rounded-full px-2.5 py-1 font-medium text-xs ${
							isPositiveGrowth
								? 'bg-primary/10 text-primary'
								: 'bg-destructive/10 text-destructive'
						}`}
					>
						{isPositiveGrowth ? '+' : ''}
						{growth.toFixed(1)}%
					</span>
				</div>
			</div>

			<ResponsiveContainer width="100%" height={300}>
				<AreaChart
					data={data}
					margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
				>
					<defs>
						<linearGradient id="colorTotalGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
							<stop
								offset="50%"
								stopColor="var(--primary)"
								stopOpacity={0.15}
							/>
							<stop
								offset="100%"
								stopColor="var(--primary)"
								stopOpacity={0.02}
							/>
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke="var(--border)"
						strokeOpacity={0.5}
						vertical={false}
					/>
					<XAxis
						dataKey="month"
						stroke="var(--border)"
						tick={{
							fill: 'var(--muted-foreground)',
							fontSize: 12
						}}
						tickLine={false}
						axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
						dy={10}
					/>
					<YAxis
						stroke="var(--border)"
						tick={{
							fill: 'var(--muted-foreground)',
							fontSize: 12
						}}
						tickLine={false}
						axisLine={false}
						tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
						dx={-5}
						width={70}
					/>
					<Tooltip
						content={<CustomTooltip />}
						wrapperStyle={{ outline: 'none' }}
						cursor={{
							stroke: 'var(--primary)',
							strokeWidth: 1,
							strokeDasharray: '4 4',
							strokeOpacity: 0.5
						}}
					/>
					<Area
						type="monotone"
						dataKey="total"
						stroke="var(--primary)"
						strokeWidth={2}
						fill="url(#colorTotalGradient)"
						name="Total"
						animationBegin={0}
						animationDuration={800}
						animationEasing="ease-out"
						dot={false}
						activeDot={{
							r: 6,
							fill: 'var(--primary)',
							stroke: 'var(--card)',
							strokeWidth: 3,
							style: {
								filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
							}
						}}
					/>
				</AreaChart>
			</ResponsiveContainer>

			<div className="mt-4 flex items-center justify-between border-border/50 border-t pt-4">
				<div className="flex items-center gap-2">
					<div
						className="size-3 rounded-full"
						style={{ backgroundColor: 'var(--primary)' }}
					/>
					<span className="text-muted-foreground text-sm">
						Patrimônio Total
					</span>
				</div>
				<span className="font-bold text-lg text-primary">
					{formatCurrency(lastValue)}
				</span>
			</div>
		</div>
	)
}
