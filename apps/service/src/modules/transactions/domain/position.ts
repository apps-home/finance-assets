import { PayloadError } from '@/core/domain/errors/payload-error'

import { Transaction, TransactionType } from './transaction.entity'

/** Sobra de arredondamento abaixo disso é tratada como posição zerada */
const QUANTITY_EPSILON = 1e-8

/**
 * No mesmo dia: o saldo inicial vem antes de tudo, os eventos (vigentes desde
 * a abertura do pregão) antes dos negócios e a compra antes da venda.
 */
const SAME_DAY_ORDER: Record<TransactionType, number> = {
  [TransactionType.OPENING]: 0,
  [TransactionType.SPLIT]: 1,
  [TransactionType.REVERSE_SPLIT]: 1,
  [TransactionType.BONUS]: 1,
  [TransactionType.BUY]: 2,
  [TransactionType.SELL]: 3
}

export interface RealizedSale {
  transactionId: string
  date: Date
  quantity: number
  /** Valor da venda menos taxas, na moeda da categoria */
  netProceeds: number
  /** Preço médio × quantidade vendida */
  cost: number
  /** Lucro (positivo) ou prejuízo (negativo) */
  result: number
}

export interface Position {
  quantity: number
  /** Inclui as taxas de compra; null com a posição zerada */
  averagePrice: number | null
  totalCost: number
  realized: RealizedSale[]
}

export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      SAME_DAY_ORDER[a.type] - SAME_DAY_ORDER[b.type] ||
      a.createdAt.getTime() - b.createdAt.getTime()
  )
}

/**
 * Refaz as operações em ordem e chega à posição pelo custo médio ponderado
 * (regra da Receita): as taxas de compra entram no custo e a venda baixa o
 * custo pelo preço médio. Lança `PayloadError` quando a sequência é
 * impossível (venda maior que a posição, operação antes do saldo inicial).
 */
export function buildPosition(transactions: Transaction[]): Position {
  let quantity = 0
  let totalCost = 0
  const realized: RealizedSale[] = []
  const sorted = sortTransactions(transactions)

  sorted.forEach((transaction, index) => {
    const qty = transaction.quantity ?? 0
    const price = transaction.price ?? 0

    switch (transaction.type) {
      case TransactionType.OPENING:
        if (index > 0) {
          throw new PayloadError(
            'The opening position must be the first operation of the asset'
          )
        }
        quantity = qty
        totalCost = qty * price
        break

      case TransactionType.BUY:
        quantity += qty
        totalCost += qty * price + transaction.fees
        break

      case TransactionType.BONUS:
        quantity += qty
        totalCost += qty * price
        break

      case TransactionType.SELL: {
        if (qty > quantity + QUANTITY_EPSILON) {
          throw new PayloadError(
            `Sale on ${transaction.date.toISOString().slice(0, 10)} is larger than the position (${quantity})`
          )
        }

        const cost = quantity > 0 ? (totalCost * qty) / quantity : 0
        const netProceeds = qty * price - transaction.fees

        realized.push({
          transactionId: transaction.id,
          date: transaction.date,
          quantity: qty,
          netProceeds,
          cost,
          result: netProceeds - cost
        })

        quantity -= qty
        totalCost -= cost
        break
      }

      case TransactionType.SPLIT:
        quantity *= transaction.factor ?? 1
        break

      case TransactionType.REVERSE_SPLIT:
        quantity /= transaction.factor ?? 1
        break
    }

    if (quantity < QUANTITY_EPSILON) {
      quantity = 0
      totalCost = 0
    }
  })

  return {
    quantity,
    averagePrice: quantity > 0 ? totalCost / quantity : null,
    totalCost,
    realized
  }
}

/**
 * Dinheiro novo da operação em R$: compra soma (com taxas), venda subtrai (sem
 * as taxas). Saldo inicial e eventos não são aporte.
 */
export function contributionInBrl(transaction: Transaction): number {
  const rate = transaction.exchangeRate ?? 1

  switch (transaction.type) {
    case TransactionType.BUY:
      return (transaction.grossAmount + transaction.fees) * rate
    case TransactionType.SELL:
      return -(transaction.grossAmount - transaction.fees) * rate
    default:
      return 0
  }
}
