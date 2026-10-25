import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'

export interface AssetProps {
  id: string
  categoryId: string
  name: string
  ticker: string
  quantity: number | null
  averagePrice: number | null
  broker: string | null
  isActive: boolean
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
        'id' | 'categoryId' | 'dividendsImportedAt' | 'createdAt' | 'updatedAt'
      >
    >
  ) {
    if (props.name !== undefined && props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    this._props = {
      ...this._props,
      ...omitUndefined(props),
      ...(props.name !== undefined && { name: props.name.trim() }),
      // Outro ticker tem outro histórico de proventos
      ...(props.ticker !== undefined &&
        props.ticker !== this._props.ticker && { dividendsImportedAt: null }),
      updatedAt: new Date()
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
