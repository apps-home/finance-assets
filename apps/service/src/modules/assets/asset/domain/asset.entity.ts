import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'
import type { MarketAsset } from '@/modules/assets/market-asset/domain/market-asset.entity'

import { FixedIncomeIndexer } from './fixed-income-valuation'

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
  /** Renda fixa com saldo calculado pelo indexador; null = saldo manual */
  indexer: FixedIncomeIndexer | null
  /** CDI: % do CDI; IPCA: taxa real ao ano; PRE: taxa ao ano */
  indexerRate: number | null
  investedAt: Date | null
  maturityAt: Date | null
  /**
   * Com operações registradas, quantidade e preço médio são calculados a
   * partir delas (não é coluna: vem da contagem de `asset_transactions`)
   */
  hasTransactions: boolean
  createdAt: Date
  updatedAt: Date
}

type IndexationProps = Pick<
  AssetProps,
  'indexer' | 'indexerRate' | 'investedAt' | 'maturityAt' | 'averagePrice'
>

function validateIndexation(props: IndexationProps) {
  if (!props.indexer) return

  if (props.indexerRate === null || !Number.isFinite(props.indexerRate)) {
    throw new PayloadError('Indexed fixed income needs a rate')
  }

  if (props.indexer === FixedIncomeIndexer.CDI && props.indexerRate <= 0) {
    throw new PayloadError('The percentage of the CDI must be positive')
  }

  if (!props.investedAt) {
    throw new PayloadError('Indexed fixed income needs the investment date')
  }

  if (props.averagePrice === null) {
    throw new PayloadError('Indexed fixed income needs the invested amount')
  }

  if (props.maturityAt && props.maturityAt < props.investedAt) {
    throw new PayloadError('The maturity must be after the investment date')
  }
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
      | 'indexer'
      | 'indexerRate'
      | 'investedAt'
      | 'maturityAt'
      | 'hasTransactions'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Asset {
    if (props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    const indexation: IndexationProps = {
      indexer: props.indexer ?? null,
      indexerRate: props.indexerRate ?? null,
      investedAt: props.investedAt ?? null,
      maturityAt: props.maturityAt ?? null,
      averagePrice: props.averagePrice ?? null
    }

    validateIndexation(indexation)

    return new Asset({
      ...indexation,
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
      hasTransactions: props.hasTransactions ?? false,
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
        | 'hasTransactions'
        | 'createdAt'
        | 'updatedAt'
      >
    >
  ) {
    if (props.name !== undefined && props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    // Com cotação de mercado o preço vem do catálogo e, com indexador, do
    // cálculo: em nenhum dos dois casos vem de edição manual. Com operações,
    // quantidade e preço médio também são calculados.
    const { currentClosePrice, quantity, averagePrice, ...rest } = props
    const next: AssetProps = {
      ...this._props,
      ...omitUndefined(rest),
      ...(!this._props.hasTransactions &&
        omitUndefined({ quantity, averagePrice }))
    }

    validateIndexation(next)

    this._props = {
      ...next,
      ...(!next.marketAssetId &&
        !next.indexer &&
        currentClosePrice !== undefined && { currentClosePrice }),
      ...(props.name !== undefined && { name: props.name.trim() }),
      // Outro ticker tem outro histórico de proventos
      ...(props.ticker !== undefined &&
        props.ticker !== this._props.ticker && { dividendsImportedAt: null }),
      updatedAt: new Date()
    }
  }

  /**
   * Posição calculada pelas operações; `null` quando o ativo ficou sem
   * operações (mantém os últimos valores, que voltam a ser editáveis)
   */
  applyPosition(
    position: { quantity: number; averagePrice: number | null } | null
  ) {
    this._props = {
      ...this._props,
      ...(position && {
        quantity: position.quantity,
        averagePrice: position.averagePrice
      }),
      hasTransactions: position !== null,
      updatedAt: new Date()
    }
  }

  /** Saldo por unidade calculado pelo indexador (renda fixa automática) */
  applyIndexedPrice(price: number) {
    if (!this._props.indexer) return

    this._props = { ...this._props, currentClosePrice: price }
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

  get indexer(): FixedIncomeIndexer | null {
    return this._props.indexer
  }

  get indexerRate(): number | null {
    return this._props.indexerRate
  }

  get investedAt(): Date | null {
    return this._props.investedAt
  }

  get maturityAt(): Date | null {
    return this._props.maturityAt
  }

  get hasTransactions(): boolean {
    return this._props.hasTransactions
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
