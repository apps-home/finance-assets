import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'

export interface BudgetProps {
  id: string
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
  /** Aporte líquido do mês em R$ (usado no cálculo de rentabilidade) */
  contributionAmount?: number | null
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
      throw new PayloadError('Month must be between 1 and 12')
    }

    if (
      props.exchangeRate !== null &&
      props.exchangeRate !== undefined &&
      props.exchangeRate <= 0
    ) {
      throw new PayloadError('Exchange rate must be greater than 0')
    }

    if (
      props.dividendAmount !== null &&
      props.dividendAmount !== undefined &&
      props.dividendAmount < 0
    ) {
      throw new PayloadError(
        'Dividend amount must be greater than or equal to 0'
      )
    }

    Budget.assertValidContribution(props.contributionAmount)

    return new Budget({
      id: props.id || crypto.randomUUID(),
      categoryId: props.categoryId,
      month: props.month,
      year: props.year,
      amount: props.amount,
      exchangeRate: props.exchangeRate,
      dividendAmount: props.dividendAmount,
      contributionAmount: props.contributionAmount,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<
      Omit<
        BudgetProps,
        | 'id'
        | 'categoryId'
        | 'month'
        | 'year'
        | 'amount'
        | 'exchangeRate'
        | 'createdAt'
        | 'updatedAt'
      >
    >
  ): void {
    if (
      props.dividendAmount !== null &&
      props.dividendAmount !== undefined &&
      props.dividendAmount < 0
    ) {
      throw new PayloadError(
        'Dividend amount must be greater than or equal to 0'
      )
    }

    Budget.assertValidContribution(props.contributionAmount)

    this._props = {
      ...this._props,
      ...omitUndefined(props),
      updatedAt: new Date()
    }
  }

  private static assertValidContribution(value?: number | null): void {
    if (value !== null && value !== undefined && !Number.isFinite(value)) {
      throw new PayloadError('Contribution amount must be a valid number')
    }
  }

  /**
   * O valor é guardado já convertido para a moeda base (amount = valor original * cotação).
   * Esta é a única forma de alterar o valor, para nunca converter duas vezes.
   */
  changeAmount(originalAmount: number, exchangeRate: number): void {
    if (exchangeRate <= 0) {
      throw new PayloadError('Exchange rate must be greater than 0')
    }

    this._props = {
      ...this._props,
      amount: Number((originalAmount * exchangeRate).toFixed(2)),
      exchangeRate,
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

  get originalAmount(): number {
    const rate = this._props.exchangeRate

    return rate ? Number((this._props.amount / rate).toFixed(2)) : this.amount
  }

  get dividendAmount(): number | null | undefined {
    return this._props.dividendAmount
  }

  get contributionAmount(): number | null | undefined {
    return this._props.contributionAmount
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
