import type {
  EconomicIndicator,
  IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'

export abstract class IndicatorRateRepository {
  /** Valores entre `from` e `to` (inclusive), do mais antigo para o mais novo */
  abstract list(
    indicator: EconomicIndicator,
    from: Date,
    to: Date
  ): Promise<IndicatorRate[]>
  /** Primeira e última data gravadas, ou null se não há nada */
  abstract bounds(
    indicator: EconomicIndicator
  ): Promise<{ first: Date; last: Date } | null>
  /** Grava ignorando datas já existentes (os valores publicados não mudam) */
  abstract saveMany(
    indicator: EconomicIndicator,
    rates: IndicatorRate[]
  ): Promise<void>
}
