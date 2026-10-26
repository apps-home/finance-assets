import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'
import type { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'

export interface AssetProps {
  id: string
  categoryId: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
  broker: string | null
  isActive: boolean
  /** Ativo do catálogo de onde vem a cotação; null para preço manual */
  marketAssetId: string | null
  /** Cotação do catálogo, ou o preço manual quando não há `marketAssetId` */
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  dividendsImportedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Asset implements AssetProps {
  private _props: AssetProps

  constructor(props: AssetProps) {
    this._props = props
  }

  static create(
    props: Optional<
      AssetProps,
      | 'id'
      | 'ticker'
      | 'quantity'
      | 'averagePrice'
      | 'broker'
      | 'isActive'
      | 'marketAssetId'
      | 'currentClosePrice'
      | 'lastMonthClosePrice'
      | 'dividendsImportedAt'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Asset {
    if (props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    return new Asset({
      id: props.id || crypto.randomUUID(),
      categoryId: props.categoryId,
      name: props.name,
      ticker: props.ticker || '',
      quantity: props.quantity ?? null,
      averagePrice: props.averagePrice ?? null,
      broker: props.broker ?? null,
      isActive: props.isActive ?? true,
      marketAssetId: props.marketAssetId ?? null,
      currentClosePrice: props.currentClosePrice ?? null,
      lastMonthClosePrice: props.lastMonthClosePrice ?? null,
      dividendsImportedAt: props.dividendsImportedAt ?? null,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<
      Omit<
        AssetProps,
        | 'id'
        | 'categoryId'
        | 'marketAssetId'
        | 'lastMonthClosePrice'
        | 'dividendsImportedAt'
        | 'createdAt'
        | 'updatedAt'
      >
    >
  ) {
    if (props.name !== undefined && props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    // Com cotação de mercado o preço vem do catálogo, não de edição manual
    const { currentClosePrice, ...rest } = props

    this._props = {
      ...this._props,
      ...omitUndefined(rest),
      ...(!this._props.marketAssetId &&
        currentClosePrice !== undefined && { currentClosePrice }),
      ...(props.name !== undefined && { name: props.name.trim() }),
      // Outro ticker tem outro histórico de proventos
      ...(props.ticker !== undefined &&
        props.ticker !== this._props.ticker && { dividendsImportedAt: null }),
      updatedAt: new Date()
    }
  }

  /**
   * Aponta o ativo para o catálogo de mercado (e assume a cotação dele), ou
   * desfaz o vínculo e volta a usar só o preço manual.
   */
  linkMarketAsset(
    marketAsset: Pick<
      MarketAsset,
      'id' | 'currentClosePrice' | 'lastMonthClosePrice'
    > | null
  ) {
    this._props = {
      ...this._props,
      marketAssetId: marketAsset?.id ?? null,
      ...(marketAsset
        ? {
            currentClosePrice: marketAsset.currentClosePrice,
            lastMonthClosePrice: marketAsset.lastMonthClosePrice
          }
        : { lastMonthClosePrice: null })
    }
  }

  markDividendsImported(at: Date) {
    this._props.dividendsImportedAt = at
  }

  get id(): string {
    return this._props.id
  }

  get categoryId(): string {
    return this._props.categoryId
  }

  get name(): string {
    return this._props.name
  }

  get ticker(): string {
    return this._props.ticker
  }

  get quantity(): number | null {
    return this._props.quantity
  }

  get averagePrice(): number | null {
    return this._props.averagePrice
  }

  get broker(): string | null {
    return this._props.broker
  }

  get isActive(): boolean {
    return this._props.isActive
  }

  get marketAssetId(): string | null {
    return this._props.marketAssetId
  }

  get currentClosePrice(): number | null {
    return this._props.currentClosePrice
  }

  get lastMonthClosePrice(): number | null {
    return this._props.lastMonthClosePrice
  }

  get dividendsImportedAt(): Date | null {
    return this._props.dividendsImportedAt
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
