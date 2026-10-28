/** ABOVE: avisa quando subir até o alvo; BELOW: quando cair até ele */
export type PriceAlertDirection = 'ABOVE' | 'BELOW'

/** ARMED: vigiando; TRIGGERED: alvo atingido, volta a vigiar ao sair da faixa */
export type PriceAlertStatus = 'ARMED' | 'TRIGGERED'

export interface PriceAlert {
  id: string
  assetId: string | null
  wishlistId: string | null
  /** Ticker vigiado (o da origem quando o alerta foi criado) */
  ticker: string
  name: string
  currency: string
  targetPrice: number
  direction: PriceAlertDirection
  status: PriceAlertStatus
  currentPrice: number | null
  lastTriggeredAt: string | null
  lastTriggeredPrice: number | null
  triggerCount: number
  createdAt: string
}

/** Origem do alerta: um ativo **ou** um item da wishlist */
export type PriceAlertSource = { assetId: string } | { wishlistId: string }

export type CreatePriceAlertDTO = PriceAlertSource & { targetPrice: number }

export interface ListPriceAlertsParams {
  assetId?: string
  wishlistId?: string
}
