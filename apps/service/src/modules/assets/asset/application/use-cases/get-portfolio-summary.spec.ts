import { makeAsset } from '@test/factories/make-asset'
import { makeBudget } from '@test/factories/make-budget'
import { makeCategory } from '@test/factories/make-category'
import { InMemoryAssetRepository } from '@test/repositories/in-memory-asset.repository'
import { InMemoryBudgetRepository } from '@test/repositories/in-memory-budget.repository'
import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { AssetMapper } from '../../domain/asset.mapper'
import { buildPortfolioSummary } from '../../domain/portfolio-summary'
import { GetPortfolioSummaryUseCase } from './get-portfolio-summary'

describe('GetPortfolioSummaryUseCase', () => {
  let categoryRepository: InMemoryCategoryRepository
  let assetRepository: InMemoryAssetRepository
  let budgetRepository: InMemoryBudgetRepository
  let sut: GetPortfolioSummaryUseCase

  beforeEach(() => {
    categoryRepository = new InMemoryCategoryRepository()
    assetRepository = new InMemoryAssetRepository(categoryRepository)
    budgetRepository = new InMemoryBudgetRepository(categoryRepository)
    sut = new GetPortfolioSummaryUseCase(assetRepository, budgetRepository)

    categoryRepository.items.push(
      makeCategory({
        id: 'category-us',
        userId: 'user-1',
        type: CategoryType.VARIABLE_US,
        currency: 'USD'
      }),
      makeCategory({ id: 'category-other', userId: 'user-2' })
    )
  })

  it('should only evaluate the active assets of the user', async () => {
    const listSpy = vi.spyOn(assetRepository, 'list')

    await sut.execute('user-1')

    expect(listSpy).toHaveBeenCalledWith({ userId: 'user-1', status: 'ACTIVE' })
  })

  it('should build the summary from the user assets', async () => {
    const asset = makeAsset({
      categoryId: 'category-us',
      ticker: 'AAPL',
      quantity: 2,
      averagePrice: 100,
      currentClosePrice: 150
    })
    assetRepository.items.push(
      asset,
      makeAsset({ categoryId: 'category-us', isActive: false }),
      makeAsset({ categoryId: 'category-other', quantity: 1, averagePrice: 1 })
    )

    const result = await sut.execute('user-1')

    expect(result.isRight()).toBe(true)

    const category = categoryRepository.items[0]
    expect(result.value).toEqual(
      buildPortfolioSummary(
        [
          {
            ...AssetMapper.toHTTP(asset),
            category: {
              id: category.id,
              name: category.name,
              type: category.type,
              currency: category.currency
            }
          }
        ],
        new Map()
      )
    )
  })

  it('should use the latest exchange rate of each category', async () => {
    const asset = makeAsset({
      categoryId: 'category-us',
      quantity: 2,
      averagePrice: 100,
      currentClosePrice: 150
    })
    assetRepository.items.push(asset)

    // budgets chegam do mais recente para o mais antigo
    vi.spyOn(budgetRepository, 'list').mockResolvedValue([
      makeBudget({ categoryId: 'category-us', exchangeRate: 5 }),
      makeBudget({ categoryId: 'category-us', exchangeRate: 4 })
    ])

    const result = await sut.execute('user-1')

    const category = categoryRepository.items[0]
    expect(result.value).toEqual(
      buildPortfolioSummary(
        [
          {
            ...AssetMapper.toHTTP(asset),
            category: {
              id: category.id,
              name: category.name,
              type: category.type,
              currency: category.currency
            }
          }
        ],
        new Map([['category-us', 5]])
      )
    )
  })

  it('should not break for a user without assets or budgets', async () => {
    const result = await sut.execute('user-3')

    expect(result.isRight()).toBe(true)
  })
})
