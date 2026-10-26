import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

/** Tipos com cotação de mercado: só eles entram no catálogo */
export const MARKET_QUOTED_TYPES: CategoryType[] = [
  CategoryType.VARIABLE_BR,
  CategoryType.FII,
  CategoryType.VARIABLE_US,
  CategoryType.CRYPTO
]

/** Cotação mais nova que isso é reaproveitada ao cadastrar um ativo */
export const QUOTE_FRESHNESS_MS = 12 * 60 * 60 * 1000

export interface MarketAssetProps {
  id: string
  ticker: string
  type: CategoryType
  name: string
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  priceUpdatedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Ativo do catálogo compartilhado (um por ticker + tipo). Guarda a cotação
 * que todos os ativos e itens da wishlist com o mesmo ticker reaproveitam.
 */
export class MarketAsset implements MarketAssetProps {
  private _props: MarketAssetProps

  constructor(props: MarketAssetProps) {
    this._props = props
  }

  static normalizeTicker(ticker: string): string {
    return ticker.trim().toUpperCase()
  }

  /** Se um ativo desse tipo e ticker tem cotação de mercado */
  static isQuoted(type: CategoryType, ticker: string | null | undefined) {
    return MARKET_QUOTED_TYPES.includes(type) && !!ticker?.trim()
  }

  static create(
    props: Optional<
      MarketAssetProps,
      | 'id'
      | 'currentClosePrice'
      | 'lastMonthClosePrice'
      | 'priceUpdatedAt'
      | 'createdAt'
      | 'updatedAt'
    >
  ): MarketAsset {
    if (!MarketAsset.isQuoted(props.type, props.ticker)) {
      throw new PayloadError('Market assets need a ticker of a quoted type')
    }

    return new MarketAsset({
      id: props.id || crypto.randomUUID(),
      ticker: MarketAsset.normalizeTicker(props.ticker),
      type: props.type,
      name: props.name.trim(),
      currentClosePrice: props.currentClosePrice ?? null,
      lastMonthClosePrice: props.lastMonthClosePrice ?? null,
      priceUpdatedAt: props.priceUpdatedAt ?? null,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  updateQuote(
    currentClosePrice: number,
    lastMonthClosePrice: number | null,
    at: Date = new Date()
  ) {
    this._props = {
      ...this._props,
      currentClosePrice,
      lastMonthClosePrice,
      priceUpdatedAt: at,
      updatedAt: at
    }
  }

  hasFreshQuote(now: Date = new Date()): boolean {
    return (
      this._props.currentClosePrice !== null &&
      this._props.priceUpdatedAt !== null &&
      now.getTime() - this._props.priceUpdatedAt.getTime() < QUOTE_FRESHNESS_MS
    )
  }

  get id(): string {
    return this._props.id
  }

  get ticker(): string {
    return this._props.ticker
  }

  get type(): CategoryType {
    return this._props.type
  }

  get name(): string {
    return this._props.name
  }

  get currentClosePrice(): number | null {
    return this._props.currentClosePrice
  }

  get lastMonthClosePrice(): number | null {
    return this._props.lastMonthClosePrice
  }

  get priceUpdatedAt(): Date | null {
    return this._props.priceUpdatedAt
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
