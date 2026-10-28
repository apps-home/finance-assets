import { Card, CardContent } from '@lib/ui/components/card'
import { cn } from '@lib/ui/lib/utils'
import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, icon, children, className }: SectionProps) {
  return (
    <section
      data-slot="asset-detail-section"
      className={cn('space-y-3', className)}
    >
      <h3 className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  )
}

interface MetricCardProps {
  title: string
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function MetricCard({
  title,
  badge,
  children,
  footer
}: MetricCardProps) {
  return (
    <Card data-slot="asset-metric-card" className="bg-card/60 shadow-none">
      <CardContent className="space-y-3 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-muted-foreground text-xs">
            {title}
          </span>
          {badge}
        </div>
        <div className="grid grid-cols-2 gap-3">{children}</div>
        {footer}
      </CardContent>
    </Card>
  )
}

interface StatProps {
  label: string
  value: ReactNode
  className?: string
  valueClassName?: string
}

export function Stat({ label, value, className, valueClassName }: StatProps) {
  return (
    <div data-slot="asset-stat" className={cn('min-w-0', className)}>
      <span className="block text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          'block truncate font-semibold text-foreground text-sm tabular-nums',
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  )
}

interface DetailItemProps {
  icon: ReactNode
  label: string
  value: ReactNode
}

export function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div
      data-slot="asset-detail-item"
      className="space-y-1 rounded-lg border border-border bg-muted/10 p-2.5"
    >
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </span>
      <span className="block truncate font-medium text-foreground text-xs">
        {value}
      </span>
    </div>
  )
}

interface PMGaugeProps {
  average: number
  current: number
  isAbove: boolean
}

/** Barra com a posição do preço médio e da cotação atual */
export function PMGauge({ average, current, isAbove }: PMGaugeProps) {
  const min = Math.min(average, current)
  const max = Math.max(average, current)
  const span = max - min || 1
  // Margem de 15% de cada lado para os marcadores não colarem na borda
  const pos = (v: number) => 15 + ((v - min) / span) * 70

  return (
    <div
      data-slot="asset-pm-gauge"
      className="relative h-1.5 rounded-full bg-muted"
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-y-0 rounded-full',
          isAbove ? 'bg-primary/60' : 'bg-destructive/60'
        )}
        style={{
          left: `${pos(Math.min(average, current))}%`,
          width: `${pos(max) - pos(min)}%`
        }}
      />
      <span
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-muted-foreground"
        style={{ left: `${pos(average)}%` }}
      />
      <span
        className={cn(
          'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background',
          isAbove ? 'bg-primary' : 'bg-destructive'
        )}
        style={{ left: `${pos(current)}%` }}
      />
    </div>
  )
}
