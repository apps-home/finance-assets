import type { Asset } from '@/modules/assets/asset/domain/asset.entity'
import type { Dividend } from '@/modules/dividends/domain/dividend.entity'
import { buildPosition } from '@/modules/transactions/domain/position'
import {
  type Transaction,
  TransactionType
} from '@/modules/transactions/domain/transaction.entity'

export interface AssetTotalReturn {
  assetId: string
  /** Resultado de preço da posição atual (o mesmo `profitLoss` do ativo) */
  unrealizedResult: number
  /** Lucro ou prejuízo das vendas já feitas */
  realizedResult: number
  /** Proventos líquidos já pagos */
  dividendsReceived: number
  /** Soma dos três acima; tudo na moeda da categoria */
  totalReturn: number
  /** Base do percentual: custo de tudo o que foi comprado */
  investedCapital: number | null
  totalReturnPercentage: number | null
}

/** Operações que colocam dinheiro (ou custo atribuído) na posição */
const ACQUISITION_TYPES = [
  TransactionType.OPENING,
  TransactionType.BUY,
  TransactionType.BONUS
]

const round = (value: number) => Math.round(value * 100) / 100

/**
 * Retorno total de um ativo: preço da posição atual + vendas realizadas +
 * proventos líquidos recebidos. Sem operações, o capital investido é a posição
 * atual (quantidade × preço médio); com operações, é o custo de todas as
 * compras, para o percentual não inflar depois de uma venda parcial.
 */
export function calcAssetTotalReturn(
  asset: Asset,
  transactions: Transaction[],
  dividends: Dividend[],
  now = new Date()
): AssetTotalReturn {
  const { quantity, averagePrice } = asset
  const currentPrice = asset.currentClosePrice ?? averagePrice

  const unrealizedResult =
    quantity !== null && averagePrice !== null && currentPrice !== null
      ? quantity * (currentPrice - averagePrice)
      : 0

  let realizedResult = 0
  try {
    realizedResult = buildPosition(transactions).realized.reduce(
      (sum, sale) => sum + sale.result,
      0
    )
  } catch {
    // Sequência inconsistente (já barrada na escrita): ignora o realizado
  }

  const dividendsReceived = dividends
    .filter((dividend) => dividend.paymentDate.getTime() <= now.getTime())
    .reduce((sum, dividend) => sum + dividend.netAmount, 0)

  const acquisitions = transactions.filter((transaction) =>
    ACQUISITION_TYPES.includes(transaction.type)
  )

  const investedCapital =
    acquisitions.length > 0
      ? acquisitions.reduce(
          (sum, transaction) =>
            sum + transaction.grossAmount + transaction.fees,
          0
        )
      : quantity !== null && averagePrice !== null
        ? quantity * averagePrice
        : null

  const totalReturn = unrealizedResult + realizedResult + dividendsReceived

  return {
    assetId: asset.id,
    unrealizedResult: round(unrealizedResult),
    realizedResult: round(realizedResult),
    dividendsReceived: round(dividendsReceived),
    totalReturn: round(totalReturn),
    investedCapital: investedCapital !== null ? round(investedCapital) : null,
    totalReturnPercentage:
      investedCapital !== null && investedCapital > 0
        ? (totalReturn / investedCapital) * 100
        : null
  }
}
