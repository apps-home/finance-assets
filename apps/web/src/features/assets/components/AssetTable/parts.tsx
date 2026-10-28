import { Button } from '@lib/ui/components/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@lib/ui/components/tooltip'
import { cn } from '@lib/ui/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { TREND_CLASSES } from '@/shared/utils/trend-classes'

interface TrendBadgeProps {
  positive: boolean
  icon?: ReactNode
  children: ReactNode
}

export function TrendBadge({ positive, icon, children }: TrendBadgeProps) {
  return (
    <span
      data-slot="trend-badge"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-semibold text-xs tabular-nums',
        positive ? TREND_CLASSES.positive.badge : TREND_CLASSES.negative.badge
      )}
    >
      {icon}
      {children}
    </span>
  )
}

export function EmptyValue() {
  return <span className="text-muted-foreground/60 text-xs">—</span>
}

interface RowActionsProps {
  asset: AssetWithCategory
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
}

export function RowActions({ asset, onEdit, onDelete }: RowActionsProps) {
  return (
    <div
      data-slot="asset-row-actions"
      className="flex items-center justify-end gap-0.5"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Editar ativo"
              onClick={() => onEdit(asset)}
            >
              <Pencil className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <TooltipContent>Editar Ativo</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive/80"
              aria-label="Remover ativo"
              onClick={() => onDelete(asset)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          }
        />
        <TooltipContent>Remover Ativo</TooltipContent>
      </Tooltip>
    </div>
  )
}
