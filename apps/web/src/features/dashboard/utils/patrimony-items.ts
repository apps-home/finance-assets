import type { LucideIcon } from 'lucide-react'
import { Building2, Car, CreditCard, Laptop, Package } from 'lucide-react'

import { PatrimonyItemType, type PatrimonySummary } from '../api/types'

export const PATRIMONY_ITEM_TYPE_LABELS: Record<PatrimonyItemType, string> = {
  [PatrimonyItemType.REAL_ESTATE]: 'Imóvel',
  [PatrimonyItemType.VEHICLE]: 'Veículo',
  [PatrimonyItemType.EQUIPMENT]: 'Equipamento',
  [PatrimonyItemType.OTHER_ASSET]: 'Outro Bem / Direito',
  [PatrimonyItemType.LIABILITY]: 'Passivo / Financiamento'
}

export const PATRIMONY_ITEM_TYPE_ICONS: Record<PatrimonyItemType, LucideIcon> =
  {
    [PatrimonyItemType.REAL_ESTATE]: Building2,
    [PatrimonyItemType.VEHICLE]: Car,
    [PatrimonyItemType.EQUIPMENT]: Laptop,
    [PatrimonyItemType.OTHER_ASSET]: Package,
    [PatrimonyItemType.LIABILITY]: CreditCard
  }

export const PATRIMONY_ITEM_TYPE_BADGE: Record<PatrimonyItemType, string> = {
  [PatrimonyItemType.REAL_ESTATE]:
    'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  [PatrimonyItemType.VEHICLE]:
    'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  [PatrimonyItemType.EQUIPMENT]:
    'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  [PatrimonyItemType.OTHER_ASSET]:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  [PatrimonyItemType.LIABILITY]:
    'border-destructive/30 bg-destructive/10 text-destructive'
}

export interface NetWorthBreakdown {
  /** Ativos financeiros líquidos (AssetRecords) */
  financialAssets: number
  /** Soma dos bens físicos ativos */
  physicalAssets: number
  /** Soma dos passivos/financiamentos ativos */
  liabilities: number
  /** Saldo físico líquido (physicalAssets - liabilities) */
  netPhysicalBalance: number
  /** Patrimônio bruto (financialAssets + physicalAssets) */
  grossAssets: number
  /** Patrimônio líquido completo (financialAssets + physicalAssets - liabilities) */
  netWorth: number
  /** % em ativos financeiros líquidos sobre o patrimônio bruto (0-100) */
  liquidSharePct: number
  /** % imobilizado em bens físicos sobre o patrimônio bruto (0-100) */
  immobilizedSharePct: number
}

export function calculateNetWorthBreakdown(
  financialAssets: number,
  summary: PatrimonySummary
): NetWorthBreakdown {
  const physicalAssets = summary.totalPhysicalAssets
  const liabilities = summary.totalLiabilities
  const netPhysicalBalance = summary.netPhysicalBalance
  const grossAssets = financialAssets + physicalAssets
  const netWorth = financialAssets + netPhysicalBalance

  const liquidSharePct =
    grossAssets > 0 ? (financialAssets / grossAssets) * 100 : 0
  const immobilizedSharePct =
    grossAssets > 0 ? (physicalAssets / grossAssets) * 100 : 0

  return {
    financialAssets,
    physicalAssets,
    liabilities,
    netPhysicalBalance,
    grossAssets,
    netWorth,
    liquidSharePct,
    immobilizedSharePct
  }
}
