import { InMemoryIndicatorRateRepository } from '@test/repositories/in-memory-indicator-rate.repository'
import { vi } from 'vitest'

import type { IndicatorDataGateway } from '@/core/http/external/indicators/indicator-data.gateway'
import { RevalueFixedIncomeUseCase } from '@/modules/assets/asset/application/use-cases/revalue-fixed-income'
import type { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { SyncIndicatorRatesUseCase } from '@/modules/indicators/application/use-cases/sync-indicator-rates'

/** Recalculo de renda fixa com CDI/IPCA em memória e provider sem dados */
export function makeRevalueFixedIncome(assetRepository: AssetRepository) {
  const indicatorRepository = new InMemoryIndicatorRateRepository()
  const fetchRates = vi.fn<IndicatorDataGateway['fetchRates']>(async () => [])
  const revalue = new RevalueFixedIncomeUseCase(
    assetRepository,
    indicatorRepository,
    new SyncIndicatorRatesUseCase(indicatorRepository, {
      fetchRates
    } as unknown as IndicatorDataGateway)
  )

  return { revalue, indicatorRepository, fetchRates }
}
