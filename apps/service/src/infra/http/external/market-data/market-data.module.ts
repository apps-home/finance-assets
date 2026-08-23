import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'

import { AlphaVantageMarketDataProvider } from './alpha-vantage/alpha-vantage-market-data.provider'
import { BrapiMarketDataProvider } from './brapi/brapi-market-data.provider'
import { CoinGeckoMarketDataProvider } from './coingecko/coingecko-market-data.provider'
import { MarketDataFactory } from './market-data.factory'

@Module({
  imports: [HttpModule],
  providers: [
    BrapiMarketDataProvider,
    CoinGeckoMarketDataProvider,
    AlphaVantageMarketDataProvider,
    { provide: MarketDataGateway, useClass: MarketDataFactory }
  ],
  exports: [MarketDataGateway]
})
export class MarketDataModule {}
