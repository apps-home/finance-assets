import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { DividendDataGateway } from '@/core/http/external/market-data/dividend-data.gateway'

import { BrapiDividendDataProvider } from './brapi/brapi-dividend-data.provider'
import { DividendDataFactory } from './dividend-data.factory'
import { PolygonDividendDataProvider } from './polygon/polygon-dividend-data.provider'

@Module({
  imports: [HttpModule],
  providers: [
    BrapiDividendDataProvider,
    PolygonDividendDataProvider,
    { provide: DividendDataGateway, useClass: DividendDataFactory }
  ],
  exports: [DividendDataGateway]
})
export class DividendDataModule {}
