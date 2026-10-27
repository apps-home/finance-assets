import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'
import { startOfDayUtc } from '@/core/utils/utc-date'

export enum TransactionType {
  /** Posição de antes do registro de operações (quantidade e preço médio) */
  OPENING = 'OPENING',
  BUY = 'BUY',
  SELL = 'SELL',
  /** Desdobramento: cada ação vira `factor` ações */
  SPLIT = 'SPLIT',
  /** Grupamento: `factor` ações viram uma */
  REVERSE_SPLIT = 'REVERSE_SPLIT',
  /** Bonificação: `quantity` ações novas com custo atribuído `price` */
  BONUS = 'BONUS'
}

export enum TransactionSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT'
}

/** Tipos que movimentam dinheiro e precisam de preço */
const PRICED_TYPES = [
  TransactionType.OPENING,
  TransactionType.BUY,
  TransactionType.SELL,
  TransactionType.BONUS
]

const FACTOR_TYPES = [TransactionType.SPLIT, TransactionType.REVERSE_SPLIT]

export interface TransactionProps {
  id: string
  assetId: string
  userId: string
  type: TransactionType
  source: TransactionSource
  /** Data do negócio, 00:00 UTC */
  date: Date
  quantity: number | null
  /** Preço unitário na moeda da categoria (BONUS: custo atribuído por ação) */
  price: number | null
  /** Corretagem, emolumentos e taxas, na moeda da categoria */
  fees: number
  /** SPLIT e REVERSE_SPLIT: proporção */
  factor: number | null
  /** Cotação para BRL (categorias em moeda estrangeira) */
  exchangeRate: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

type EditableProps = Omit<
  TransactionProps,
  'id' | 'assetId' | 'userId' | 'source' | 'createdAt' | 'updatedAt'
>

function validate(props: EditableProps) {
  if (Number.isNaN(props.date.getTime())) {
    throw new PayloadError('Date is invalid')
  }

  if (FACTOR_TYPES.includes(props.type)) {
    if (props.factor === null || !(props.factor > 0) || props.factor === 1) {
      throw new PayloadError('Splits need a factor greater than zero and not 1')
    }
    return
  }

  if (props.quantity === null || !(props.quantity > 0)) {
    throw new PayloadError('Quantity must be greater than zero')
  }

  if (PRICED_TYPES.includes(props.type)) {
    // Bonificação pode vir sem custo atribuído (preço 0)
    const validPrice =
      props.price !== null &&
      (props.type === TransactionType.BONUS
        ? props.price >= 0
        : props.price > 0)

    if (!validPrice) {
      throw new PayloadError('Price must be greater than zero')
    }
  }

  if (!(props.fees >= 0)) {
    throw new PayloadError('Fees cannot be negative')
  }

  if (props.exchangeRate !== null && !(props.exchangeRate > 0)) {
    throw new PayloadError('Exchange rate must be greater than zero')
  }
}

/** Mantém só os campos que fazem sentido para o tipo */
function normalize(props: EditableProps): EditableProps {
  const isFactor = FACTOR_TYPES.includes(props.type)

  return {
    ...props,
    date: startOfDayUtc(props.date),
    quantity: isFactor ? null : props.quantity,
    price: isFactor ? null : props.price,
    fees: isFactor ? 0 : props.fees,
    factor: isFactor ? props.factor : null,
    notes: props.notes?.trim() || null
  }
}

export class Transaction implements TransactionProps {
  private _props: TransactionProps

  constructor(props: TransactionProps) {
    this._props = props
  }

  static create(
    props: Optional<
      TransactionProps,
      | 'id'
      | 'source'
      | 'quantity'
      | 'price'
      | 'fees'
      | 'factor'
      | 'exchangeRate'
      | 'notes'
      | 'createdAt'
      | 'updatedAt'
    >
  ): Transaction {
    const editable = normalize({
      type: props.type,
      date: props.date,
      quantity: props.quantity ?? null,
      price: props.price ?? null,
      fees: props.fees ?? 0,
      factor: props.factor ?? null,
      exchangeRate: props.exchangeRate ?? null,
      notes: props.notes ?? null
    })

    validate(editable)

    return new Transaction({
      ...editable,
      id: props.id || crypto.randomUUID(),
      assetId: props.assetId,
      userId: props.userId,
      source: props.source ?? TransactionSource.MANUAL,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(props: Partial<EditableProps>) {
    const next = normalize({ ...this.editableProps(), ...omitUndefined(props) })

    validate(next)

    this._props = { ...this._props, ...next, updatedAt: new Date() }
  }

  private editableProps(): EditableProps {
    const {
      id: _id,
      assetId: _assetId,
      userId: _userId,
      source: _source,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...editable
    } = this._props

    return editable
  }

  /** Valor bruto da operação (quantidade × preço), na moeda da categoria */
  get grossAmount(): number {
    return (this._props.quantity ?? 0) * (this._props.price ?? 0)
  }

  get id(): string {
    return this._props.id
  }

  get assetId(): string {
    return this._props.assetId
  }

  get userId(): string {
    return this._props.userId
  }

  get type(): TransactionType {
    return this._props.type
  }

  get source(): TransactionSource {
    return this._props.source
  }

  get date(): Date {
    return this._props.date
  }

  get quantity(): number | null {
    return this._props.quantity
  }

  get price(): number | null {
    return this._props.price
  }

  get fees(): number {
    return this._props.fees
  }

  get factor(): number | null {
    return this._props.factor
  }

  get exchangeRate(): number | null {
    return this._props.exchangeRate
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
