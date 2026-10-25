import { Injectable, Logger } from '@nestjs/common'

import { DividendDataGateway } from '@/core/http/external/market-data/dividend-data.gateway'
import { Either, right } from '@/core/utils/Either'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'
import { BudgetRepository } from '@/modules/budgets/domain/budget.repository'

import {
  Dividend,
  DividendSource,
  DividendType,
  toCalendarDate
} from '../../domain/dividend.entity'
import { DividendRepository } from '../../domain/dividend.repository'

export interface SyncDividendTarget {
  assetId: string
  userId: string
  categoryId: string
  currency: string
}

export interface SyncAssetDividendsPayload {
  ticker: string
  categoryType: CategoryType
  targets: SyncDividendTarget[]
  /**
   * Modo backfill (ISO date): importa todo pagamento a partir dessa data,
   * ignorando a data de cadastro do ativo. Sem ele, só entram pagamentos de
   * quando o ativo já era seu. Usa sempre a quantidade atual do ativo.
   */
  since?: string
}

type SyncAssetDividendsResponse = Either<
  Error,
  { created: number; updated: number }
>

@Injectable()
export class SyncAssetDividendsUseCase {
  private readonly logger = new Logger(SyncAssetDividendsUseCase.name)

  constructor(
    private readonly dividendRepository: DividendRepository,
    private readonly assetRepository: AssetRepository,
    private readonly budgetRepository: BudgetRepository,
    private readonly dividendDataGateway: DividendDataGateway
  ) {}

  async execute({
    ticker,
    categoryType,
    targets,
    since
  }: SyncAssetDividendsPayload): Promise<SyncAssetDividendsResponse> {
    const result = { created: 0, updated: 0 }

    const provider = this.dividendDataGateway.getProvider(categoryType)

    if (!provider) {
      return right(result)
    }

    // Uma única chamada externa por ticker, aplicada a todos os usuários
    const external = await provider.fetchDividends(ticker)

    // Falha na consulta: não marca como importado para tentar de novo depois
    if (external === null) {
      return right(result)
    }

    // Sem proventos só encerra o sync semanal; o backfill ainda marca o ativo
    if (external.length === 0 && !since) {
      return right(result)
    }

    const now = new Date()
    const sinceTime = since ? new Date(since).getTime() : null
    const imported: string[] = []

    for (const target of targets) {
      const asset = await this.assetRepository.findByIdForSystem(target.assetId)

      if (!asset?.isActive || !asset.quantity) continue

      let exchangeRate: number | null = null

      if (target.currency !== 'BRL') {
        exchangeRate = await this.findLatestExchangeRate(
          target.userId,
          target.categoryId
        )

        if (!exchangeRate) {
          this.logger.warn(
            `No exchange rate found for category ${target.categoryId}; skipping ${ticker} dividends for this asset.`
          )
          continue
        }
      }

      imported.push(asset.id)

      for (const item of external) {
        if (sinceTime !== null) {
          if (item.paymentDate.getTime() < sinceTime) continue
        } else {
          // Só tem direito quem já possuía o ativo na data COM
          const ownedSince = asset.createdAt.getTime()
          const entitlementDate = (item.comDate ?? item.paymentDate).getTime()

          if (entitlementDate < ownedSince) continue
        }

        const type = item.type as DividendType
        const amount = Math.round(item.rateAmount * asset.quantity * 100) / 100

        if (amount <= 0) continue

        const existing = await this.dividendRepository.findByNaturalKey(
          asset.id,
          type,
          toCalendarDate(item.paymentDate)
        )

        if (!existing) {
          await this.dividendRepository.save(
            Dividend.create({
              userId: target.userId,
              assetId: asset.id,
              type,
              source: DividendSource.SYNC,
              amount,
              rateAmount: item.rateAmount,
              quantity: asset.quantity,
              exchangeRate,
              comDate: item.comDate,
              paymentDate: item.paymentDate
            })
          )
          result.created++
          continue
        }

        // Lançamentos manuais nunca são sobrescritos, e pagamentos já
        // realizados não são recalculados com a quantidade atual.
        if (
          existing.source === DividendSource.MANUAL ||
          existing.paymentDate.getTime() <= now.getTime()
        ) {
          continue
        }

        existing.update({
          amount,
          rateAmount: item.rateAmount,
          quantity: asset.quantity,
          exchangeRate,
          comDate: item.comDate
        })
        await this.dividendRepository.save(existing)
        result.updated++
      }
    }

    if (since && imported.length > 0) {
      await this.assetRepository.markDividendsImported(imported, now)
    }

    this.logger.log(
      `Dividends synced for ${ticker}: ${result.created} created, ${result.updated} updated.`
    )

    return right(result)
  }

  private async findLatestExchangeRate(
    userId: string,
    categoryId: string
  ): Promise<number | null> {
    // Budgets vêm do mais recente para o mais antigo
    const budgets = await this.budgetRepository.list({ userId, categoryId })

    return (
      budgets.find((budget) => (budget.exchangeRate ?? 0) > 0)?.exchangeRate ??
      null
    )
  }
}
