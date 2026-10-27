import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { makeDividend } from '@test/factories/make-dividend'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryDividendRepository } from '@test/repositories/in-memory-dividend.repository'
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import type { DividendWithAsset } from '@/modules/dividends/domain/dividend.repository'
import type { FindAllDividendsParams } from '@/modules/dividends/domain/dto/find-all-dividends-params.dto'
import {
  Transaction,
  TransactionType
} from '@/modules/transactions/domain/transaction.entity'

import { GetAssetTotalReturnsUseCase } from './get-asset-total-returns'

/** O repositório em memória não lista; aqui basta filtrar pelo usuário */
class ListingDividendRepository extends InMemoryDividendRepository {
  async list(params?: FindAllDividendsParams): Promise<DividendWithAsset[]> {
    return this.items
      .filter((dividend) => dividend.userId === params?.userId)
      .map((dividend) => ({
        dividend,
        asset: {
          id: dividend.assetId,
          name: '',
          ticker: '',
          quantity: null,
          averagePrice: null
        },
        category: { id: '', name: '', type: 'VARIABLE_BR', currency: 'BRL' }
      })) as DividendWithAsset[]
  }
}

describe('GetAssetTotalReturnsUseCase', () => {
  let assetRepository: InMemoryAssetRepository
  let dividendRepository: ListingDividendRepository
  let transactionRepository: InMemoryTransactionRepository
  let sut: GetAssetTotalReturnsUseCase

  beforeEach(() => {
    const categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    dividendRepository = new ListingDividendRepository()
    transactionRepository = new InMemoryTransactionRepository(
      assetRepository,
      categoryRepository
    )
    sut = new GetAssetTotalReturnsUseCase(
      assetRepository,
      dividendRepository,
      transactionRepository
    )

    categoryRepository.items.push(
      makeCategory({ id: 'category-1', userId: 'user-1' }),
      makeCategory({ id: 'category-2', userId: 'user-2' })
    )
  })

  it('should return the total return of each asset of the user only', async () => {
    const mine = makeAsset({
      categoryId: 'category-1',
      quantity: 10,
      averagePrice: 10,
      currentClosePrice: 12
    })
    const other = makeAsset({ categoryId: 'category-2', quantity: 1 })
    assetRepository.items.push(mine, other)

    transactionRepository.items.push(
      Transaction.create({
        assetId: mine.id,
        userId: 'user-1',
        type: TransactionType.BUY,
        date: new Date('2026-01-10'),
        quantity: 10,
        price: 10
      })
    )
    dividendRepository.items.push(
      makeDividend({
        userId: 'user-1',
        assetId: mine.id,
        amount: 7,
        paymentDate: new Date('2026-02-10')
      }),
      makeDividend({
        userId: 'user-2',
        assetId: other.id,
        amount: 100,
        paymentDate: new Date('2026-02-10')
      })
    )

    const result = await sut.execute('user-1')

    expect(result.value).toEqual([
      expect.objectContaining({
        assetId: mine.id,
        unrealizedResult: 20,
        dividendsReceived: 7,
        totalReturn: 27,
        investedCapital: 100
      })
    ])
  })
})
