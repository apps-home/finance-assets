export enum BenchmarkType {
  CDI = 'CDI',
  IBOV = 'IBOV',
  SP500_BRL = 'SP500_BRL'
}

export interface MonthKey {
  year: number
  /** 1-12 */
  month: number
}

export interface BenchmarkMonthlyReturn extends MonthKey {
  /** Retorno do mês em % (1.05 = +1,05%) */
  returnPct: number
}

export abstract class BenchmarkDataGateway {
  /**
   * Retornos mensais já fechados, a partir de `since` (inclusive).
   * Devolve `null` quando o provider falha, para o chamador tentar depois.
   */
  abstract fetchMonthlyReturns(
    benchmark: BenchmarkType,
    since: MonthKey
  ): Promise<BenchmarkMonthlyReturn[] | null>
}
