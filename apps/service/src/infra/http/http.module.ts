import { HttpModule as AxiosHttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { MarketDataModule } from './external/market-data/market-data.module'

@Module({
  imports: [
    AxiosHttpModule.register({
      timeout: 10000
    }),
    MarketDataModule
  ]
})
export class HttpModule {}
