import { PriceAlert, PriceAlertStatus } from './price-alert.entity'

export type PriceAlertSourceKind = 'ASSET' | 'WISHLIST'

export interface PriceAlertSource {
  kind: PriceAlertSourceKind
  id: string
  name: string
  /** Moeda da categoria da origem: a do alvo e a da cotação */
  currency: string
}

export interface PriceAlertWithDetails {
  alert: PriceAlert
  /** Ticker vigiado e cotação atual, do catálogo */
  ticker: string
  currentPrice: number | null
  source: PriceAlertSource
}

export interface ListPriceAlertsParams {
  userId: string
  assetId?: string
  wishlistId?: string
}

export abstract class PriceAlertRepository {
  abstract create(alert: PriceAlert): Promise<void>
  abstract findById(id: string, userId: string): Promise<PriceAlert | null>
  abstract list(params: ListPriceAlertsParams): Promise<PriceAlertWithDetails[]>
  abstract delete(id: string): Promise<void>
  /** Sistema (sem usuário): todos os alertas que vigiam o ticker */
  abstract findByMarketAsset(
    marketAssetId: string
  ): Promise<PriceAlertWithDetails[]>
  /**
   * Grava o estado novo do alerta só se ele ainda estiver em `from` (update
   * condicional). `false`: outra avaliação já fez essa transição.
   */
  abstract transition(
    alert: PriceAlert,
    from: PriceAlertStatus
  ): Promise<boolean>
}
