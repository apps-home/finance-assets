import { PayloadError } from '@/core/domain/errors/payload-error'

export enum PriceAlertDirection {
  /** Avisa quando a cotação subir até o alvo */
  ABOVE = 'ABOVE',
  /** Avisa quando a cotação cair até o alvo */
  BELOW = 'BELOW'
}

export enum PriceAlertStatus {
  /** Vigiando: notifica quando a cotação atingir o alvo */
  ARMED = 'ARMED',
  /** Alvo atingido: volta a vigiar quando a cotação sair da faixa */
  TRIGGERED = 'TRIGGERED'
}

/** O que uma cotação nova pede: notificar, voltar a vigiar ou nada */
export type PriceAlertEvaluation = 'TRIGGER' | 'REARM' | null

export interface PriceAlertProps {
  id: string
  userId: string
  /** Ticker vigiado (catálogo), fixado na criação */
  marketAssetId: string
  /** Origem: um ativo da carteira ou um item da wishlist, nunca os dois */
  assetId: string | null
  wishlistId: string | null
  /** Na moeda da categoria da origem */
  targetPrice: number
  direction: PriceAlertDirection
  status: PriceAlertStatus
  lastTriggeredAt: Date | null
  lastTriggeredPrice: number | null
  triggerCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreatePriceAlertProps {
  userId: string
  marketAssetId: string
  assetId?: string | null
  wishlistId?: string | null
  targetPrice: number
  /** Cotação atual do ticker: decide se o alerta é de alta ou de queda */
  currentPrice: number | null
}

/**
 * Alerta de preço que rearma sozinho: ao atingir o alvo notifica e fica
 * TRIGGERED; quando a cotação sai da faixa volta a ARMED, pronto para avisar
 * no próximo cruzamento.
 */
export class PriceAlert implements PriceAlertProps {
  private _props: PriceAlertProps

  constructor(props: PriceAlertProps) {
    this._props = props
  }

  static create({
    userId,
    marketAssetId,
    assetId = null,
    wishlistId = null,
    targetPrice,
    currentPrice
  }: CreatePriceAlertProps): PriceAlert {
    if (!assetId === !wishlistId) {
      throw new PayloadError(
        'A price alert needs exactly one source: an asset or a wishlist item'
      )
    }

    if (!(targetPrice > 0)) {
      throw new PayloadError('Target price must be greater than zero')
    }

    if (currentPrice === null) {
      throw new PayloadError('The asset has no quote yet')
    }

    if (targetPrice === currentPrice) {
      throw new PayloadError('Target price is already the current price')
    }

    const now = new Date()

    return new PriceAlert({
      id: crypto.randomUUID(),
      userId,
      marketAssetId,
      assetId,
      wishlistId,
      targetPrice,
      direction:
        targetPrice > currentPrice
          ? PriceAlertDirection.ABOVE
          : PriceAlertDirection.BELOW,
      status: PriceAlertStatus.ARMED,
      lastTriggeredAt: null,
      lastTriggeredPrice: null,
      triggerCount: 0,
      createdAt: now,
      updatedAt: now
    })
  }

  /** Se a cotação está na faixa do alerta (o próprio alvo conta) */
  isReachedBy(price: number): boolean {
    return this._props.direction === PriceAlertDirection.ABOVE
      ? price >= this._props.targetPrice
      : price <= this._props.targetPrice
  }

  evaluate(price: number): PriceAlertEvaluation {
    const reached = this.isReachedBy(price)

    if (this._props.status === PriceAlertStatus.ARMED && reached) {
      return 'TRIGGER'
    }

    if (this._props.status === PriceAlertStatus.TRIGGERED && !reached) {
      return 'REARM'
    }

    return null
  }

  markTriggered(price: number, at: Date = new Date()) {
    this._props = {
      ...this._props,
      status: PriceAlertStatus.TRIGGERED,
      lastTriggeredAt: at,
      lastTriggeredPrice: price,
      triggerCount: this._props.triggerCount + 1,
      updatedAt: at
    }
  }

  rearm(at: Date = new Date()) {
    this._props = {
      ...this._props,
      status: PriceAlertStatus.ARMED,
      updatedAt: at
    }
  }

  get id(): string {
    return this._props.id
  }

  get userId(): string {
    return this._props.userId
  }

  get marketAssetId(): string {
    return this._props.marketAssetId
  }

  get assetId(): string | null {
    return this._props.assetId
  }

  get wishlistId(): string | null {
    return this._props.wishlistId
  }

  get targetPrice(): number {
    return this._props.targetPrice
  }

  get direction(): PriceAlertDirection {
    return this._props.direction
  }

  get status(): PriceAlertStatus {
    return this._props.status
  }

  get lastTriggeredAt(): Date | null {
    return this._props.lastTriggeredAt
  }

  get lastTriggeredPrice(): number | null {
    return this._props.lastTriggeredPrice
  }

  get triggerCount(): number {
    return this._props.triggerCount
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
