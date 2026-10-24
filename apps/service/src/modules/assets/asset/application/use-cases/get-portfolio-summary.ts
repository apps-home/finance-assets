import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'
import { BudgetRepository } from '@/modules/budgets/domain/budget.repository'

import { AssetMapper } from '../../domain/asset.mapper'
import { AssetRepository } from '../../domain/asset.repository'
import {
  buildPortfolioSummary,
  PortfolioSummary
} from '../../domain/portfolio-summary'

type GetPortfolioSummaryResponse = Either<Error, PortfolioSummary>

@Injectable()
export class GetPortfolioSummaryUseCase {
  constructor(
    private assetRepository: AssetRepository,
    private budgetRepository: BudgetRepository
  ) {}

  async execute(userId: string): Promise<GetPortfolioSummaryResponse> {
    const [items, budgets] = await Promise.all([
      this.assetRepository.list({ userId, status: 'ACTIVE' }),
      this.budgetRepository.list({ userId })
    ])

    // budgets vêm ordenados do mais recente para o mais antigo,
    // então a primeira cotação válida de cada categoria é a mais atual
    const exchangeRates = new Map<string, number>()
    for (const budget of budgets) {
      const rate = budget.exchangeRate
      if (rate && rate > 0 && !exchangeRates.has(budget.categoryId)) {
        exchangeRates.set(budget.categoryId, rate)
      }
    }

    const assets = items.map(({ asset, category }) => ({
      ...AssetMapper.toHTTP(asset),
      category
    }))

    return right(buildPortfolioSummary(assets, exchangeRates))
  }
}
