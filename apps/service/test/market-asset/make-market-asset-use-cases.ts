import { InMemoryMarketAssetRepository } from '@test/repositories/in-memory-market-asset.repository'

import { RefreshMarketAssetQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/refresh-market-asset-quote'
import { ResolveMarketAssetUseCase } from '@/modules/assets/market-asset/application/use-cases/resolve-market-asset'
import { ResolveMarketAssetWithQuoteUseCase } from '@/modules/assets/market-asset/application/use-cases/resolve-market-asset-with-quote'

import { FakeMarketDataGateway } from './fake-market-data-gateway'

/** Catálogo de mercado em memória com os use cases já ligados */
export function makeMarketAssetUseCases() {
  const marketAssetRepository = new InMemoryMarketAssetRepository()
  const gateway = new FakeMarketDataGateway()
  const resolve = new ResolveMarketAssetUseCase(marketAssetRepository)
  const refresh = new RefreshMarketAssetQuoteUseCase(
    marketAssetRepository,
    gateway
  )
  const resolveWithQuote = new ResolveMarketAssetWithQuoteUseCase(
    resolve,
    refresh
  )

  return { marketAssetRepository, gateway, resolve, refresh, resolveWithQuote }
}
