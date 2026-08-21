import { DomainError } from '@/core/domain/errors/domain-error'
import { Optional } from '@/core/utils/Optional'

export interface BudgetProps {
  id: string
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
  createdAt: Date
  updatedAt: Date
}

export class Budget implements BudgetProps {
  private _props: BudgetProps

  constructor(props: BudgetProps) {
    this._props = props
  }

  static create(
    props: Optional<BudgetProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Budget {
    if (props.month < 1 || props.month > 12) {
      throw new DomainError('Month must be between 1 and 12')
    }

    if (
      props.exchangeRate !== null &&
      props.exchangeRate !== undefined &&
      props.exchangeRate <= 0
    ) {
      throw new DomainError('Exchange rate must be greater than 0')
    }

    if (
      props.dividendAmount !== null &&
      props.dividendAmount !== undefined &&
      props.dividendAmount < 0
    ) {
      throw new DomainError(
        'Dividend amount must be greater than or equal to 0'
      )
    }

    return new Budget({
      id: props.id || crypto.randomUUID(),
      categoryId: props.categoryId,
      month: props.month,
      year: props.year,
      amount: props.amount,
      exchangeRate: props.exchangeRate,
      dividendAmount: props.dividendAmount,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<Omit<BudgetProps, 'id' | 'createdAt' | 'updatedAt'>>
  ): void {
    if (props.month && (props.month < 1 || props.month > 12)) {
      throw new DomainError('Month must be between 1 and 12')
    }

    if (
      props.exchangeRate !== null &&
      props.exchangeRate !== undefined &&
      props.exchangeRate <= 0
    ) {
      throw new DomainError('Exchange rate must be greater than 0')
    }

    if (
      props.dividendAmount !== null &&
      props.dividendAmount !== undefined &&
      props.dividendAmount < 0
    ) {
      throw new DomainError(
        'Dividend amount must be greater than or equal to 0'
      )
    }

    this._props = {
      ...this._props,
      ...props,
      updatedAt: new Date()
    }
  }

  updateAmountWithExchangeRate(exchangeRate: number): void {
    if (
      this.exchangeRate === null ||
      this.exchangeRate === undefined ||
      exchangeRate === null ||
      exchangeRate === undefined ||
      exchangeRate <= 0
    ) {
      throw new DomainError(
        'Cannot update amount with exchange rate when exchangeRate is null, undefined or less than or equal to 0'
      )
    }

    const newAmount = this.amount * exchangeRate

    this._props = {
      ...this._props,
      amount: parseFloat(newAmount.toFixed(2)),
      updatedAt: new Date()
    }
  }

  get id(): string {
    return this._props.id
  }

  get categoryId(): string {
    return this._props.categoryId
  }

  get month(): number {
    return this._props.month
  }

  get year(): number {
    return this._props.year
  }

  get amount(): number {
    return this._props.amount
  }

  get exchangeRate(): number | null | undefined {
    return this._props.exchangeRate
  }

  get dividendAmount(): number | null | undefined {
    return this._props.dividendAmount
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
