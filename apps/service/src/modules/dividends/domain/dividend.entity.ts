import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'

export enum DividendType {
  DIVIDEND = 'DIVIDEND',
  JCP = 'JCP',
  INCOME = 'INCOME',
  OTHER = 'OTHER'
}

export enum DividendSource {
  MANUAL = 'MANUAL',
  SYNC = 'SYNC'
}

export interface DividendProps {
  id: string
  userId: string
  assetId: string
  type: DividendType
  source: DividendSource
  /** Total recebido, na moeda da categoria do ativo */
  amount: number
  /** Impostos/taxas retidos (opcional), na mesma moeda do `amount` */
  taxAmount: number | null
  /** Valor pago por cota/ação */
  rateAmount: number | null
  quantity: number | null
  /** Cotação para BRL (categorias em moeda estrangeira) */
  exchangeRate: number | null
  comDate: Date | null
  paymentDate: Date
  createdAt: Date
  updatedAt: Date
}

// O pagamento é uma data de calendário: normaliza para 00:00 UTC, o que também
// mantém estável a chave única (assetId, type, paymentDate) usada pelo sync.
export function toCalendarDate(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  )
}

function assertTaxBelowAmount(amount: number, taxAmount: number | null) {
  if (taxAmount !== null && taxAmount >= amount) {
    throw new PayloadError('Tax amount must be less than the amount')
  }
}

function validate(
  props: Partial<
    Pick<
      DividendProps,
      'amount' | 'taxAmount' | 'exchangeRate' | 'paymentDate' | 'quantity'
    >
  >
) {
  if (props.amount !== undefined && !(props.amount > 0)) {
    throw new PayloadError('Amount must be greater than zero')
  }

  if (
    props.taxAmount !== undefined &&
    props.taxAmount !== null &&
    !(props.taxAmount >= 0)
  ) {
    throw new PayloadError('Tax amount cannot be negative')
  }

  if (
    props.exchangeRate !== undefined &&
    props.exchangeRate !== null &&
    !(props.exchangeRate > 0)
  ) {
    throw new PayloadError('Exchange rate must be greater than zero')
  }

  if (
    props.quantity !== undefined &&
    props.quantity !== null &&
    !(props.quantity > 0)
  ) {
    throw new PayloadError('Quantity must be greater than zero')
  }

  if (
    props.paymentDate !== undefined &&
    Number.isNaN(props.paymentDate.getTime())
  ) {
    throw new PayloadError('Payment date is invalid')
  }
}

export class Dividend implements DividendProps {
  private _props: DividendProps

  constructor(props: DividendProps) {
    this._props = props
  }

  static create(
    props: Optional<
      DividendProps,
      | 'id'
      | 'type'
      | 'source'
      | 'rateAmount'
      | 'taxAmount'
      | 'quantity'
      | 'exchangeRate'
      | 'comDate'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Dividend {
    validate(props)
    assertTaxBelowAmount(props.amount, props.taxAmount ?? null)

    return new Dividend({
      id: props.id || crypto.randomUUID(),
      userId: props.userId,
      assetId: props.assetId,
      type: props.type ?? DividendType.DIVIDEND,
      source: props.source ?? DividendSource.MANUAL,
      amount: props.amount,
      taxAmount: props.taxAmount ?? null,
      rateAmount: props.rateAmount ?? null,
      quantity: props.quantity ?? null,
      exchangeRate: props.exchangeRate ?? null,
      comDate: props.comDate ? toCalendarDate(props.comDate) : null,
      paymentDate: toCalendarDate(props.paymentDate),
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<
      Omit<
        DividendProps,
        'id' | 'userId' | 'assetId' | 'createdAt' | 'updatedAt'
      >
    >
  ) {
    validate(props)

    const next = { ...this._props, ...omitUndefined(props) }
    assertTaxBelowAmount(next.amount, next.taxAmount)

    this._props = {
      ...this._props,
      ...omitUndefined(props),
      ...(props.paymentDate !== undefined && {
        paymentDate: toCalendarDate(props.paymentDate)
      }),
      ...(props.comDate && { comDate: toCalendarDate(props.comDate) }),
      updatedAt: new Date()
    }
  }

  /** Valor líquido: total recebido menos impostos/taxas retidos */
  get netAmount(): number {
    return (
      Math.round((this._props.amount - (this._props.taxAmount ?? 0)) * 100) /
      100
    )
  }

  /** Líquido convertido para BRL */
  get amountInBRL(): number {
    return this.netAmount * (this._props.exchangeRate ?? 1)
  }

  get id(): string {
    return this._props.id
  }

  get userId(): string {
    return this._props.userId
  }

  get assetId(): string {
    return this._props.assetId
  }

  get type(): DividendType {
    return this._props.type
  }

  get source(): DividendSource {
    return this._props.source
  }

  get amount(): number {
    return this._props.amount
  }

  get taxAmount(): number | null {
    return this._props.taxAmount
  }

  get rateAmount(): number | null {
    return this._props.rateAmount
  }

  get quantity(): number | null {
    return this._props.quantity
  }

  get exchangeRate(): number | null {
    return this._props.exchangeRate
  }

  get comDate(): Date | null {
    return this._props.comDate
  }

  get paymentDate(): Date {
    return this._props.paymentDate
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
