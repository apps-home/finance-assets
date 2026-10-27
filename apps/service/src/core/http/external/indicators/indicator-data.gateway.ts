export enum EconomicIndicator {
  /** Taxa DI diária, em % ao dia (só existe em dia útil) */
  CDI = 'CDI',
  /** Variação mensal, em % no mês (data = dia 1º do mês de referência) */
  IPCA = 'IPCA'
}

export interface IndicatorRate {
  /** Dia em UTC 00:00 */
  date: Date
  ratePct: number
}

export abstract class IndicatorDataGateway {
  /**
   * Valores entre `from` e `to` (inclusive). Devolve `[]` quando o intervalo
   * não tem dado (ex.: fim de semana) e `null` quando o provider falha.
   */
  abstract fetchRates(
    indicator: EconomicIndicator,
    from: Date,
    to: Date
  ): Promise<IndicatorRate[] | null>
}
