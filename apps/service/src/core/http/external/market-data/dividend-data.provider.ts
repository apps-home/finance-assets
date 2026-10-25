export type ExternalDividendType = 'DIVIDEND' | 'JCP' | 'INCOME' | 'OTHER'

export interface ExternalDividend {
  type: ExternalDividendType
  /** Valor pago por cota/ação, na moeda do ativo */
  rateAmount: number
  comDate: Date | null
  paymentDate: Date
}

export abstract class DividendDataProvider {
  /** `null` quando a consulta falhou (diferente de um ticker sem proventos, `[]`) */
  abstract fetchDividends(ticker: string): Promise<ExternalDividend[] | null>
}
