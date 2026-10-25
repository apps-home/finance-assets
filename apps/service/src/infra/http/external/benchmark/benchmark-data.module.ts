import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'

import { BenchmarkDataGateway } from '@/core/http/external/benchmark/benchmark-data.gateway'

import { BcbCdiBenchmarkProvider } from './bcb-cdi-benchmark.provider'
import { BenchmarkDataFactory } from './benchmark-data.factory'
import { YahooBenchmarkProvider } from './yahoo-benchmark.provider'

@Module({
  imports: [HttpModule],
  providers: [
    BcbCdiBenchmarkProvider,
    YahooBenchmarkProvider,
    { provide: BenchmarkDataGateway, useClass: BenchmarkDataFactory }
  ],
  exports: [BenchmarkDataGateway]
})
export class BenchmarkDataModule {}
