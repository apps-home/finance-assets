export type PerformancePeriodKey = 'ytd' | '12m' | 'all'

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

export interface PortfolioPerformance {
  series: PerformancePoint[]
  periods: PerformancePeriodSummary[]
  betaIbov: number | null
}

export interface GetPerformanceParams {
  /** AAAA-MM */
  from?: string
  /** AAAA-MM */
  to?: string
}
