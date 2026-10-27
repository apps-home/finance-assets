import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { contributionInBrl } from '../../domain/position'
import { TransactionType } from '../../domain/transaction.entity'
import { TransactionRepository } from '../../domain/transaction.repository'

export interface CategoryContribution {
  categoryId: string
  /** Compras menos vendas do mês, em R$ (negativo = resgate líquido) */
  amount: number
}

type GetMonthlyContributionsResponse = Either<Error, CategoryContribution[]>

/**
 * Aporte líquido de cada categoria no mês, a partir das compras e vendas.
 * Só aparecem categorias com alguma compra ou venda no mês. É o que o
 * fechamento do mês usa para preencher o aporte.
 */
@Injectable()
export class GetMonthlyContributionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    userId: string,
    year: number,
    month: number
  ): Promise<GetMonthlyContributionsResponse> {
    const items = await this.transactionRepository.list({
      userId,
      from: new Date(Date.UTC(year, month - 1, 1)),
      to: new Date(Date.UTC(year, month, 0))
    })

    const byCategory = new Map<string, number>()

    for (const { transaction, category } of items) {
      if (
        transaction.type !== TransactionType.BUY &&
        transaction.type !== TransactionType.SELL
      ) {
        continue
      }

      byCategory.set(
        category.id,
        (byCategory.get(category.id) ?? 0) + contributionInBrl(transaction)
      )
    }

    return right(
      [...byCategory].map(([categoryId, amount]) => ({
        categoryId,
        amount: Math.round(amount * 100) / 100
      }))
    )
  }
}
