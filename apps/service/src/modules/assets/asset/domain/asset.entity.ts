import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'

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
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(props: Partial<Omit<AssetProps, 'id' | 'categoryId' | 'createdAt'>>) {
    if (props.name !== undefined && props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    this._props = {
      ...this._props,
      ...(props.name !== undefined && { name: props.name.trim() }),
      ...(props.ticker !== undefined && { ticker: props.ticker || '' }),
      ...(props.quantity !== undefined && { quantity: props.quantity ?? null }),
      ...(props.averagePrice !== undefined && {
        averagePrice: props.averagePrice ?? null
      }),
      ...(props.broker !== undefined && { broker: props.broker ?? null }),
      ...(props.isActive !== undefined && { isActive: props.isActive }),
      updatedAt: new Date()
    }
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

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
