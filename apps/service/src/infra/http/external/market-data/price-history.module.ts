import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { PriceHistoryGateway } from '@/core/http/external/market-data/price-history.gateway'

import { YahooPriceHistoryProvider } from './yahoo/yahoo-price-history.provider'

@Module({
  imports: [HttpModule],
  providers: [
    { provide: PriceHistoryGateway, useClass: YahooPriceHistoryProvider }
  ],
  exports: [PriceHistoryGateway]
})
export class PriceHistoryModule {}
