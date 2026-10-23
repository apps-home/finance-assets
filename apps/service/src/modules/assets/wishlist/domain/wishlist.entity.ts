import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'

export interface WishlistProps {
  id: string
  userId: string
  categoryId: string
  name: string
  ticker: string
  targetPrice: number | null
  currentClosePrice: number | null
  lastMonthClosePrice: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export class Wishlist implements WishlistProps {
  private _props: WishlistProps

  constructor(props: WishlistProps) {
    this._props = props
  }

  static create(
    props: Optional<
      WishlistProps,
      | 'id'
      | 'targetPrice'
      | 'currentClosePrice'
      | 'lastMonthClosePrice'
      | 'notes'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Wishlist {
    if (props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    if (!props.ticker || props.ticker.trim().length === 0) {
      throw new PayloadError('Ticker is required')
    }

    return new Wishlist({
      id: props.id || crypto.randomUUID(),
      userId: props.userId,
      categoryId: props.categoryId,
      name: props.name.trim(),
      ticker: props.ticker.trim().toUpperCase(),
      targetPrice: props.targetPrice ?? null,
      currentClosePrice: props.currentClosePrice ?? null,
      lastMonthClosePrice: props.lastMonthClosePrice ?? null,
      notes: props.notes ?? null,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<
      Omit<
        WishlistProps,
        'id' | 'userId' | 'categoryId' | 'createdAt' | 'updatedAt'
      >
    >
  ) {
    if (props.name !== undefined && props.name.trim().length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    if (props.ticker !== undefined && props.ticker.trim().length === 0) {
      throw new PayloadError('Ticker cannot be empty')
    }

    this._props = {
      ...this._props,
      ...omitUndefined(props),
      ...(props.name !== undefined && { name: props.name.trim() }),
      ...(props.ticker !== undefined && {
        ticker: props.ticker.trim().toUpperCase()
      }),
      updatedAt: new Date()
    }
  }

  get id(): string {
    return this._props.id
  }

  get userId(): string {
    return this._props.userId
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

  get targetPrice(): number | null {
    return this._props.targetPrice
  }

  get currentClosePrice(): number | null {
    return this._props.currentClosePrice
  }

  get lastMonthClosePrice(): number | null {
    return this._props.lastMonthClosePrice
  }

  get notes(): string | null {
    return this._props.notes
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
