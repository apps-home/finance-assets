'use client'

import { Fragment, useState } from 'react'

import type { AssetWithCategory } from '@/features/assets/api/types'
import { AssetDetailSheet } from '@/features/assets/components/AssetDetailSheet'
import {
  Table,
  TableBody,
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

import { AssetTableRow } from './AssetTableRow'

interface AssetTableProps {
  assets: AssetWithCategory[]
  onEdit: (asset: AssetWithCategory) => void
  onDelete: (asset: AssetWithCategory) => void
  onViewDetails?: (asset: AssetWithCategory) => void
  /** Yield on Cost (%) por id de ativo, vindo do resumo de proventos */
  yieldOnCostByAssetId?: Record<string, number>
  /** `profitLoss` dos ativos já soma vendas e proventos (retorno total) */
  includesDividends?: boolean
  className?: string
}

export function AssetTable({
  assets,
  onEdit,
  onDelete,
  onViewDetails,
  yieldOnCostByAssetId,
  includesDividends = false,
  className
}: AssetTableProps) {
  const [internalSelectedAsset, setInternalSelectedAsset] =
    useState<AssetWithCategory | null>(null)
  const [internalDetailOpen, setInternalDetailOpen] = useState(false)

  if (assets.length === 0) {
    return null
  }

  const handleOpenDetail = (asset: AssetWithCategory) => {
    if (onViewDetails) {
      onViewDetails(asset)
    } else {
      setInternalSelectedAsset(asset)
      setInternalDetailOpen(true)
    }
  }

  return (
    <Fragment>
      <div
        data-slot="asset-table-wrapper"
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-card shadow-xs',
          className
        )}
      >
        <Table data-slot="asset-table" className="min-w-220">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 w-80 bg-card font-semibold text-xs">
                Ativo & Alocação
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Cotação & Mês (MTD)
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                Preço Médio & Margem
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                {includesDividends
                  ? 'Posição & Retorno Total'
                  : 'Posição & Lucro'}
              </TableHead>
              <TableHead className="text-right font-semibold text-xs">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="cursor-help underline decoration-dotted">
                        Yield on Cost
                      </span>
                    }
                  />
                  <TooltipContent>
                    Proventos dos últimos 12 meses ÷ valor investido (quantidade
                    × preço médio)
                  </TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-20 text-right font-semibold text-xs">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <AssetTableRow
                key={asset.id}
                asset={asset}
                yieldOnCost={yieldOnCostByAssetId?.[asset.id]}
                onView={handleOpenDetail}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {!onViewDetails && (
        <AssetDetailSheet
          // Versão atual da lista: operações mudam quantidade e preço médio
          asset={
            assets.find((item) => item.id === internalSelectedAsset?.id) ??
            internalSelectedAsset
          }
          open={internalDetailOpen}
          onOpenChange={setInternalDetailOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </Fragment>
  )
}
