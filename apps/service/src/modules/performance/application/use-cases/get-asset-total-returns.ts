import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import type { Dividend } from '@/modules/dividends/domain/dividend.entity'
import { DividendRepository } from '@/modules/dividends/domain/dividend.repository'
import type { Transaction } from '@/modules/transactions/domain/transaction.entity'
import { TransactionRepository } from '@/modules/transactions/domain/transaction.repository'

import {
  type AssetTotalReturn,
  calcAssetTotalReturn
} from '../../domain/asset-total-return'

type GetAssetTotalReturnsResponse = Either<never, AssetTotalReturn[]>

/**
 * Retorno total (preço + vendas + proventos) de todos os ativos do usuário,
 * ativos e inativos. Três consultas, agrupadas em memória por ativo.
 */
@Injectable()
export class GetAssetTotalReturnsUseCase {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly dividendRepository: DividendRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  async execute(userId: string): Promise<GetAssetTotalReturnsResponse> {
    const [assets, dividends, transactions] = await Promise.all([
      this.assetRepository.list({ userId }),
      this.dividendRepository.list({ userId }),
      this.transactionRepository.list({ userId })
    ])

    const dividendsByAsset = groupBy(
      dividends.map(({ dividend }) => dividend),
      (dividend: Dividend) => dividend.assetId
    )
    const transactionsByAsset = groupBy(
      transactions.map(({ transaction }) => transaction),
      (transaction: Transaction) => transaction.assetId
    )

    const now = new Date()

    return right(
      assets.map(({ asset }) =>
        calcAssetTotalReturn(
          asset,
          transactionsByAsset.get(asset.id) ?? [],
          dividendsByAsset.get(asset.id) ?? [],
          now
        )
      )
    )
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()

  for (const item of items) {
    const list = map.get(key(item)) ?? []
    list.push(item)
    map.set(key(item), list)
  }

  return map
}
