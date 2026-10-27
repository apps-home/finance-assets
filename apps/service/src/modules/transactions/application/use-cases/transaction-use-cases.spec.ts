import { makeAsset } from '@test/factories/make-asset'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { InMemoryTransactionRepository } from '@test/repositories/in-memory-transaction.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import type { AssetProps } from '@/modules/assets/asset/domain/asset.entity'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { TransactionType } from '../../domain/transaction.entity'
import { CreateTransactionUseCase } from './create-transaction'
import { DeleteTransactionUseCase } from './delete-transaction'
import { FindAllTransactionsUseCase } from './find-all-transactions'
import { GetMonthlyContributionsUseCase } from './get-monthly-contributions'
import { UpdateTransactionUseCase } from './update-transaction'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('transaction use cases', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let transactionRepository: InMemoryTransactionRepository
  let create: CreateTransactionUseCase
  let update: UpdateTransactionUseCase
  let remove: DeleteTransactionUseCase
  let findAll: FindAllTransactionsUseCase
  let contributions: GetMonthlyContributionsUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    transactionRepository = new InMemoryTransactionRepository(
      assetRepository,
      categoryRepository
    )
    create = new CreateTransactionUseCase(
      transactionRepository,
      assetRepository,
      categoryRepository
    )
    update = new UpdateTransactionUseCase(
      transactionRepository,
      assetRepository,
      categoryRepository
    )
    remove = new DeleteTransactionUseCase(
      transactionRepository,
      assetRepository
    )
    findAll = new FindAllTransactionsUseCase(transactionRepository)
    contributions = new GetMonthlyContributionsUseCase(transactionRepository)
  })

  async function seedAsset(
    overrides: Partial<AssetProps> = {},
    category = { type: CategoryType.VARIABLE_BR, currency: 'BRL' }
  ) {
    const saved = makeCategory({ userId: 'user-1', ...category })
    await categoryRepository.save(saved)

    const asset = makeAsset({
      categoryId: saved.id,
      ticker: 'WEGE3',
      quantity: null,
      averagePrice: null,
      ...overrides
    })
    await assetRepository.save(asset)

    return asset
  }

  const assetById = (id: string) =>
    assetRepository.items.find((item) => item.id === id)

  describe('create', () => {
    it('should derive the quantity and average price of the asset', async () => {
      const asset = await seedAsset()

      await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 10,
        price: 40,
        fees: 4
      })

      expect(assetById(asset.id)).toMatchObject({
        quantity: 10,
        averagePrice: 40.4,
        hasTransactions: true
      })
    })

    it('should turn the current position into the opening on the first operation', async () => {
      const asset = await seedAsset({ quantity: 10, averagePrice: 30 })

      const result = await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-05'),
        quantity: 10,
        price: 50
      })

      expect(result.value).toMatchObject({ openingCreated: true })
      expect(
        transactionRepository.items.find(
          (item) => item.type === TransactionType.OPENING
        )
      ).toMatchObject({ date: day('2026-10-04'), quantity: 10, price: 30 })
      expect(assetById(asset.id)).toMatchObject({
        quantity: 20,
        averagePrice: 40
      })
    })

    it('should not create a second opening', async () => {
      const asset = await seedAsset({ quantity: 10, averagePrice: 30 })
      const buy = {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-05'),
        quantity: 1,
        price: 30
      }

      await create.execute('user-1', buy)
      const second = await create.execute('user-1', buy)

      expect(second.value).toMatchObject({ openingCreated: false })
      expect(transactionRepository.items).toHaveLength(3)
    })

    it('should reject a sale larger than the position', async () => {
      const asset = await seedAsset()
      await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 5,
        price: 10
      })

      const result = await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.SELL,
        date: day('2026-10-02'),
        quantity: 6,
        price: 10
      })

      expect(result.value).toBeInstanceOf(PayloadError)
      expect(transactionRepository.items).toHaveLength(1)
      expect(assetById(asset.id)?.quantity).toBe(5)
    })

    it('should require the exchange rate for buys in dollars', async () => {
      const asset = await seedAsset(
        { ticker: 'AAPL' },
        { type: CategoryType.VARIABLE_US, currency: 'USD' }
      )

      const result = await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 1,
        price: 200
      })

      expect(result.value).toBeInstanceOf(PayloadError)
    })

    it('should not accept fixed income operations yet', async () => {
      const asset = await seedAsset(
        { ticker: '' },
        { type: CategoryType.FIXED, currency: 'BRL' }
      )

      const result = await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 1,
        price: 1000
      })

      expect(result.value).toBeInstanceOf(PayloadError)
    })

    it('should not find the asset of another user', async () => {
      const asset = await seedAsset()

      const result = await create.execute('user-2', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 1,
        price: 10
      })

      expect(result.value).toBeInstanceOf(AssetNotFoundError)
    })
  })

  describe('update and delete', () => {
    async function seedBuyAndSell() {
      const asset = await seedAsset()
      await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.BUY,
        date: day('2026-10-01'),
        quantity: 10,
        price: 10
      })
      await create.execute('user-1', {
        assetId: asset.id,
        type: TransactionType.SELL,
        date: day('2026-10-02'),
        quantity: 4,
        price: 15
      })

      const [buy, sell] = transactionRepository.items
      return { asset, buy, sell }
    }

    it('should recalculate the position after an edit', async () => {
      const { asset, buy } = await seedBuyAndSell()

      await update.execute('user-1', buy.id, { quantity: 20, price: 12 })

      expect(assetById(asset.id)).toMatchObject({
        quantity: 16,
        averagePrice: 12
      })
    })

    it('should refuse to delete a buy that a later sale depends on', async () => {
      const { asset, buy } = await seedBuyAndSell()

      const result = await remove.execute('user-1', buy.id)

      expect(result.value).toBeInstanceOf(PayloadError)
      expect(transactionRepository.items).toHaveLength(2)
      expect(assetById(asset.id)?.quantity).toBe(6)
    })

    it('should make the asset editable again without operations', async () => {
      const { asset, buy, sell } = await seedBuyAndSell()

      await remove.execute('user-1', sell.id)
      await remove.execute('user-1', buy.id)

      expect(assetById(asset.id)).toMatchObject({
        quantity: 10,
        hasTransactions: false
      })
    })
  })

  it('should list the result of each sale, newest first', async () => {
    const asset = await seedAsset()
    await create.execute('user-1', {
      assetId: asset.id,
      type: TransactionType.BUY,
      date: day('2026-09-01'),
      quantity: 10,
      price: 10,
      fees: 10
    })
    await create.execute('user-1', {
      assetId: asset.id,
      type: TransactionType.SELL,
      date: day('2026-10-01'),
      quantity: 5,
      price: 15
    })

    const result = await findAll.execute({
      userId: 'user-1',
      from: day('2026-10-01')
    })
    const items = result.value as Array<{
      transaction: { type: TransactionType }
      result: number | null
    }>

    // Só outubro aparece, mas o custo vem da compra de setembro: 75 − 55
    expect(items).toHaveLength(1)
    expect(items[0].transaction.type).toBe(TransactionType.SELL)
    expect(items[0].result).toBeCloseTo(20)
  })

  it('should sum the buys and sales of the month by category, in reais', async () => {
    const stocks = await seedAsset()
    const usStocks = await seedAsset(
      { ticker: 'AAPL' },
      { type: CategoryType.VARIABLE_US, currency: 'USD' }
    )
    await create.execute('user-1', {
      assetId: stocks.id,
      type: TransactionType.BUY,
      date: day('2026-10-01'),
      quantity: 10,
      price: 10,
      fees: 1
    })
    await create.execute('user-1', {
      assetId: stocks.id,
      type: TransactionType.SELL,
      date: day('2026-10-20'),
      quantity: 2,
      price: 20
    })
    await create.execute('user-1', {
      assetId: usStocks.id,
      type: TransactionType.BUY,
      date: day('2026-10-15'),
      quantity: 1,
      price: 200,
      exchangeRate: 5
    })
    // Fora do mês
    await create.execute('user-1', {
      assetId: stocks.id,
      type: TransactionType.BUY,
      date: day('2026-11-01'),
      quantity: 1,
      price: 10
    })

    const result = await contributions.execute('user-1', 2026, 10)

    expect(result.value).toEqual(
      expect.arrayContaining([
        { categoryId: stocks.categoryId, amount: 61 },
        { categoryId: usStocks.categoryId, amount: 1000 }
      ])
    )
  })
})
