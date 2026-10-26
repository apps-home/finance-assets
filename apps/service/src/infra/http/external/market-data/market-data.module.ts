import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { MarketDataGateway } from '@/core/http/external/market-data/market-data.gateway'

import { AlphaVantageMarketDataProvider } from './alpha-vantage/alpha-vantage-market-data.provider'
import { BrapiMarketDataProvider } from './brapi/brapi-market-data.provider'
import { CoinGeckoMarketDataProvider } from './coingecko/coingecko-market-data.provider'
import { MarketDataFactory } from './market-data.factory'
import { PolygonMarketDataProvider } from './polygon/polygon-market-data.provider'
import { YahooMarketDataProvider } from './yahoo/yahoo-market-data.provider'

@Module({
  // Sem timeout o axios espera para sempre se o provider travar a conexão
  imports: [HttpModule.register({ timeout: 10_000 })],
  providers: [
    BrapiMarketDataProvider,
    CoinGeckoMarketDataProvider,
    AlphaVantageMarketDataProvider,
    PolygonMarketDataProvider,
    YahooMarketDataProvider,
    { provide: MarketDataGateway, useClass: MarketDataFactory }
  ],
  exports: [MarketDataGateway]
})
export class MarketDataModule {}
