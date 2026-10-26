import { cn } from '@/shared/lib/utils'

interface RangeGaugeProps {
  /** Posição da cotação entre a mínima (0) e a máxima (100) */
  position: number
  /** Posição do preço alvo na mesma escala, quando está dentro da faixa */
  targetPosition?: number | null
  /** Quanto mais baixo na faixa, melhor para comprar */
  className?: string
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))

/** Barra da faixa de preços do período com a cotação atual (e o alvo) */
export function RangeGauge({
  position,
  targetPosition,
  className
}: RangeGaugeProps) {
  const isLow = position <= 33
  const isHigh = position >= 67

  return (
    <div
      data-slot="wishlist-range-gauge"
      className={cn('relative h-1.5 rounded-full bg-muted', className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          isLow
            ? 'bg-primary/60'
            : isHigh
              ? 'bg-destructive/50'
              : 'bg-chart-4/60'
        )}
        style={{ width: `${clamp(position)}%` }}
      />
      {targetPosition != null && (
        <span
          className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/70"
          style={{ left: `${clamp(targetPosition)}%` }}
        />
      )}
      <span
        className={cn(
          'absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background',
          isLow ? 'bg-primary' : isHigh ? 'bg-destructive' : 'bg-chart-4'
        )}
        style={{ left: `${clamp(position)}%` }}
      />
    </div>
  )
}
