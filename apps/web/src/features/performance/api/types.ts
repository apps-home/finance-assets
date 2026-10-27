import type { CategoryType } from '@/features/categories/api/types'

export type PerformancePeriodKey = 'ytd' | '12m' | 'all'

/** Quais categorias entram no cálculo */
export type PerformanceScope = 'all' | 'variable' | 'fixed'

export interface PerformancePoint {
  year: number
  /** 1-12 */
  month: number
  /** Retorno acumulado desde o início da série, em % */
  portfolio: number
  cdi: number | null
  ibov: number | null
  sp500: number | null
}

export interface PerformancePeriodSummary {
  period: PerformancePeriodKey
  months: number
  portfolio: number
  cdi: number | null
  ibov: number | null
  sp500: number | null
  /** Carteira menos benchmark, em pontos percentuais */
  alphaCdi: number | null
  alphaIbov: number | null
  alphaSp500: number | null
}

export type BenchmarkType = 'CDI' | 'IBOV' | 'SP500_BRL' | 'IFIX' | 'BTC_BRL'

export interface BenchmarkedPeriod {
  period: PerformancePeriodKey
  months: number
  /** null quando a categoria não tem nenhum mês no período */
  portfolio: number | null
  benchmark: number | null
  /** Categoria menos benchmark, em pontos percentuais */
  alpha: number | null
}

export interface CategoryPerformance {
  categoryId: string
  name: string
  type: CategoryType
  /** Saldo do mês mais recente, em R$ */
  latestAmount: number
  benchmark: BenchmarkType
  periods: BenchmarkedPeriod[]
}

export interface PortfolioPerformance {
  series: PerformancePoint[]
  periods: PerformancePeriodSummary[]
  betaIbov: number | null
  byCategory: CategoryPerformance[]
}

export interface GetPerformanceParams {
  /** AAAA-MM */
  from?: string
  /** AAAA-MM */
  to?: string
  scope?: PerformanceScope
}
