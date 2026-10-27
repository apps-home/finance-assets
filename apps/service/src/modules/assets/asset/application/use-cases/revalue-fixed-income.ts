import { Injectable, Logger } from '@nestjs/common'

import { EconomicIndicator } from '@/core/http/external/indicators/indicator-data.gateway'
import { firstOfMonthUtc, startOfDayUtc } from '@/core/utils/utc-date'
import { SyncIndicatorRatesUseCase } from '@/modules/indicators/application/use-cases/sync-indicator-rates'
import { IndicatorRateRepository } from '@/modules/indicators/domain/indicator-rate.repository'

import { Asset } from '../../domain/asset.entity'
import { AssetRepository } from '../../domain/asset.repository'
import {
  calcFixedIncomeFactor,
  FixedIncomeIndexer
} from '../../domain/fixed-income-valuation'

export interface RevalueFixedIncomeResult {
  updated: number
  /** Sem cobertura de CDI/IPCA no período: o saldo anterior foi mantido */
  skipped: number
}

/** Preço por unidade guardado com 4 casas (`Decimal(15, 4)`) */
const round4 = (value: number) => Math.round(value * 10_000) / 10_000

/**
 * Recalcula o saldo bruto dos títulos de renda fixa com indexador (% do CDI,
 * IPCA+ ou prefixado) a partir do valor aplicado (`averagePrice`) e do CDI e
 * IPCA guardados, buscando no Banco Central o que faltar.
 */
@Injectable()
export class RevalueFixedIncomeUseCase {
  private readonly logger = new Logger(RevalueFixedIncomeUseCase.name)

  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly indicatorRateRepository: IndicatorRateRepository,
    private readonly syncIndicatorRates: SyncIndicatorRatesUseCase
  ) {}

  /**
   * Para o cadastro e a edição: uma falha no cálculo fica só no log e o
   * cron diário tenta de novo, sem desfazer o que já foi salvo.
   */
  async tryExecute(asset: Asset): Promise<void> {
    try {
      await this.execute([asset])
    } catch (error) {
      this.logger.error(
        `Failed to value fixed income asset ${asset.id}`,
        error instanceof Error ? error.stack : error
      )
    }
  }

  /** Todos os títulos indexados ativos (cron diário) */
  async executeForAll(now: Date = new Date()) {
    const assets = await this.assetRepository.findAllIndexedFixedIncome()

    return this.execute(assets, now)
  }

  async execute(
    assets: Asset[],
    now: Date = new Date()
  ): Promise<RevalueFixedIncomeResult> {
    const indexed = assets.filter(
      (asset) =>
        asset.indexer !== null &&
        asset.indexerRate !== null &&
        asset.investedAt !== null &&
        asset.averagePrice !== null
    )

    if (indexed.length === 0) return { updated: 0, skipped: 0 }

    const since = startOfDayUtc(
      new Date(
        Math.min(
          ...indexed.map((asset) => (asset.investedAt as Date).getTime())
        )
      )
    )

    await this.syncIndicatorRates.ensureCovered(since, now)

    const needsIpca = indexed.some(
      (asset) => asset.indexer === FixedIncomeIndexer.IPCA
    )
    const [cdi, ipca] = await Promise.all([
      this.indicatorRateRepository.list(EconomicIndicator.CDI, since, now),
      needsIpca
        ? this.indicatorRateRepository.list(
            EconomicIndicator.IPCA,
            firstOfMonthUtc(since),
            now
          )
        : []
    ])

    const result: RevalueFixedIncomeResult = { updated: 0, skipped: 0 }

    for (const asset of indexed) {
      const factor = calcFixedIncomeFactor(
        {
          indexer: asset.indexer as FixedIncomeIndexer,
          indexerRate: asset.indexerRate as number,
          investedAt: asset.investedAt as Date,
          maturityAt: asset.maturityAt
        },
        cdi,
        ipca,
        now
      )

      if (factor === null) {
        this.logger.warn(
          `No CDI/IPCA coverage to value fixed income asset ${asset.id}. Keeping the previous balance.`
        )
        result.skipped++
        continue
      }

      asset.applyIndexedPrice(round4((asset.averagePrice as number) * factor))
      await this.assetRepository.save(asset)
      result.updated++
    }

    return result
  }
}
