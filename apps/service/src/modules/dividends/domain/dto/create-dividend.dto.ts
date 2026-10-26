import { DividendType } from '../dividend.entity'

export interface CreateDividendPayload {
  userId: string
  assetId: string
  type?: DividendType
  /** Opcional quando `rateAmount` é informado: total = rateAmount × quantidade */
  amount?: number
  /** Impostos/taxas retidos; o líquido é `amount - taxAmount` */
  taxAmount?: number | null
  rateAmount?: number | null
  quantity?: number | null
  exchangeRate?: number | null
  comDate?: Date | null
  paymentDate: Date
}
