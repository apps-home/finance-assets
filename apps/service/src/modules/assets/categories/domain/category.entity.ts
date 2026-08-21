import { DomainError } from '@/core/domain/errors/domain-error'
import { Optional } from '@/core/utils/Optional'

export enum CategoryType {
  VARIABLE_BR = 'VARIABLE_BR',
  VARIABLE_US = 'VARIABLE_US',
  CRYPTO = 'CRYPTO',
  FIXED = 'FIXED'
}

export interface CategoryProps {
  id: string
  name: string
  type: CategoryType
  targetPercentage?: number | null
  currency: string
  userId: string
  years: number[]
  createdAt: Date
  updatedAt: Date
}

export class Category implements CategoryProps {
  private _props: CategoryProps

  constructor(props: CategoryProps) {
    this._props = props
  }

  static create(
    props: Optional<CategoryProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>
  ): Category {
    if (props.currency.trim().length <= 2) {
      throw new DomainError('Currency must be at least 3 characters long')
    }

    if (props.name.trim().length <= 1) {
      throw new DomainError('Name must be at least 2 characters long')
    }

    if (!props.years || props.years.length === 0) {
      throw new DomainError('At least one year must be provided')
    }

    if (
      props.targetPercentage !== null &&
      props.targetPercentage !== undefined &&
      (props.targetPercentage < 0 || props.targetPercentage > 100)
    ) {
      throw new DomainError('Target percentage must be between 0 and 100')
    }

    return new Category({
      id: props.id || crypto.randomUUID(),
      name: props.name,
      type: props.type ?? CategoryType.FIXED,
      targetPercentage: props.targetPercentage,
      currency: props.currency,
      userId: props.userId,
      years: props.years,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(props: Partial<Omit<CategoryProps, 'id' | 'userId' | 'createdAt'>>) {
    if (props.currency && props.currency.trim().length <= 2) {
      throw new DomainError('Currency must be at least 3 characters long')
    }

    if (props.name && props.name.trim().length <= 1) {
      throw new DomainError('Name must be at least 2 characters long')
    }

    if (props.years && props.years.length === 0) {
      throw new DomainError('At least one year must be provided')
    }

    if (
      props.targetPercentage !== null &&
      props.targetPercentage !== undefined &&
      (props.targetPercentage < 0 || props.targetPercentage > 100)
    ) {
      throw new DomainError('Target percentage must be between 0 and 100')
    }

    this._props = {
      ...this._props,
      ...props,
      updatedAt: new Date()
    }
  }

  get id(): string {
    return this._props.id
  }

  get name(): string {
    return this._props.name
  }

  get type(): CategoryType {
    return this._props.type
  }

  get currency(): string {
    return this._props.currency
  }

  get targetPercentage(): number | null | undefined {
    return this._props.targetPercentage
  }

  get userId(): string {
    return this._props.userId
  }

  get years(): number[] {
    return this._props.years
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
