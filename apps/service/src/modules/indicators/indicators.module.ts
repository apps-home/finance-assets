import { Module } from '@nestjs/common'

import { IndicatorDataModule } from '@/infra/http/external/indicators/indicator-data.module'

import { SyncIndicatorRatesUseCase } from './application/use-cases/sync-indicator-rates'
import { IndicatorRateRepository } from './domain/indicator-rate.repository'
import { PrismaIndicatorRateRepository } from './infra/repositories/prisma.indicator-rate.repository'

/** Cache de CDI diário e IPCA mensal do Banco Central (usado na renda fixa) */
@Module({
  imports: [IndicatorDataModule],
  providers: [
    {
      provide: IndicatorRateRepository,
      useClass: PrismaIndicatorRateRepository
    },
    SyncIndicatorRatesUseCase
  ],
  exports: [IndicatorRateRepository, SyncIndicatorRatesUseCase]
})
export class IndicatorsModule {}
