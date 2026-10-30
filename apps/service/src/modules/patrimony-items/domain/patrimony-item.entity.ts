import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'
import { omitUndefined } from '@/core/utils/omit-undefined'

export enum PatrimonyItemType {
  REAL_ESTATE = 'REAL_ESTATE',
  VEHICLE = 'VEHICLE',
  EQUIPMENT = 'EQUIPMENT',
  OTHER_ASSET = 'OTHER_ASSET',
  LIABILITY = 'LIABILITY'
}

export interface PatrimonyItemProps {
  id: string
  userId: string
  name: string
  type: PatrimonyItemType
  /** Valor atual estimado em BRL (sempre >= 0; o tipo LIABILITY define o sinal na soma) */
  currentValue: number
  /** Valor de aquisição original (opcional, para calcular valorização/depreciação) */
  purchaseValue: number | null
  acquiredAt: Date | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

function assertNonNegativeNumber(
  value: number | null | undefined,
  label: string,
  allowNull = false
) {
  if (value === null || value === undefined) {
    if (allowNull) return
    throw new PayloadError(`${label} is required`)
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new PayloadError(`${label} must be greater than or equal to 0`)
  }
}

function normalizeNotes(notes: string | null | undefined): string | null {
  if (notes === null || notes === undefined) return null
  const trimmed = notes.trim()
  return trimmed.length > 0 ? trimmed : null
}

export class PatrimonyItem implements PatrimonyItemProps {
  private _props: PatrimonyItemProps

  constructor(props: PatrimonyItemProps) {
    this._props = props
  }

  static create(
    props: Optional<
      PatrimonyItemProps,
      | 'id'
      | 'purchaseValue'
      | 'acquiredAt'
      | 'notes'
      | 'isActive'
      | 'createdAt'
      | 'updatedAt'
    >
  ): PatrimonyItem {
    const name = props.name?.trim() ?? ''
    if (name.length <= 1) {
      throw new PayloadError('Name must be at least 2 characters long')
    }

    assertNonNegativeNumber(props.currentValue, 'Current value')
    assertNonNegativeNumber(props.purchaseValue, 'Purchase value', true)

    return new PatrimonyItem({
      id: props.id || crypto.randomUUID(),
      userId: props.userId,
      name,
      type: props.type,
      currentValue: Number(props.currentValue.toFixed(2)),
      purchaseValue:
        props.purchaseValue !== null && props.purchaseValue !== undefined
          ? Number(props.purchaseValue.toFixed(2))
          : null,
      acquiredAt: props.acquiredAt ?? null,
      notes: normalizeNotes(props.notes),
      isActive: props.isActive ?? true,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date()
    })
  }

  update(
    props: Partial<
      Omit<PatrimonyItemProps, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >
  ): void {
    const nextProps = { ...props }

    if (nextProps.name !== undefined) {
      const trimmed = nextProps.name.trim()
      if (trimmed.length <= 1) {
        throw new PayloadError('Name must be at least 2 characters long')
      }
      nextProps.name = trimmed
    }

    if (nextProps.currentValue !== undefined) {
      assertNonNegativeNumber(nextProps.currentValue, 'Current value')
      nextProps.currentValue = Number(nextProps.currentValue.toFixed(2))
    }

    if (nextProps.purchaseValue !== undefined) {
      assertNonNegativeNumber(nextProps.purchaseValue, 'Purchase value', true)
      nextProps.purchaseValue =
        nextProps.purchaseValue !== null
          ? Number(nextProps.purchaseValue.toFixed(2))
          : null
    }

    if (nextProps.notes !== undefined) {
      nextProps.notes = normalizeNotes(nextProps.notes)
    }

    this._props = {
      ...this._props,
      ...omitUndefined(nextProps),
      updatedAt: new Date()
    }
  }

  get isLiability(): boolean {
    return this._props.type === PatrimonyItemType.LIABILITY
  }

  get isAsset(): boolean {
    return !this.isLiability
  }

  /** Sinal aplicado ao patrimônio líquido: positivo para bens, negativo para passivos */
  get signedValue(): number {
    return this.isLiability
      ? -this._props.currentValue
      : this._props.currentValue
  }

  get id(): string {
    return this._props.id
  }

  get userId(): string {
    return this._props.userId
  }

  get name(): string {
    return this._props.name
  }

  get type(): PatrimonyItemType {
    return this._props.type
  }

  get currentValue(): number {
    return this._props.currentValue
  }

  get purchaseValue(): number | null {
    return this._props.purchaseValue
  }

  get acquiredAt(): Date | null {
    return this._props.acquiredAt
  }

  get notes(): string | null {
    return this._props.notes
  }

  get isActive(): boolean {
    return this._props.isActive
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
