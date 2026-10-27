import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { IndicatorDataGateway } from '@/core/http/external/indicators/indicator-data.gateway'

import { BcbIndicatorProvider } from './bcb-indicator.provider'

@Module({
  // O SGS demora em intervalos longos; o sync busca um ano por vez
  imports: [HttpModule.register({ timeout: 30_000 })],
  providers: [
    { provide: IndicatorDataGateway, useClass: BcbIndicatorProvider }
  ],
  exports: [IndicatorDataGateway]
})
export class IndicatorDataModule {}
