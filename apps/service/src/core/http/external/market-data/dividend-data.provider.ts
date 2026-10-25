export type ExternalDividendType = 'DIVIDEND' | 'JCP' | 'INCOME' | 'OTHER'

export interface ExternalDividend {
  type: ExternalDividendType
  /** Valor pago por cota/ação, na moeda do ativo */
  rateAmount: number
  comDate: Date | null
  paymentDate: Date
}

export abstract class DividendDataProvider {
  abstract fetchDividends(ticker: string): Promise<ExternalDividend[]>
}
