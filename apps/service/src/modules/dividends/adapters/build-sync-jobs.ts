import { JOBS } from '@/core/domain/queue/queue.constants'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { SyncAssetDividendsPayload } from '../application/use-cases/sync-asset-dividends'

/**
 * Delay between requests per provider (in ms), mesmos limites da atualização
 * de preços. Tipos sem provider de dividendos não geram jobs.
 */
const PROVIDER_DELAY_MS: Partial<Record<CategoryType, number>> = {
  [CategoryType.VARIABLE_US]: 18_000,
  [CategoryType.VARIABLE_BR]: 8_000,
  [CategoryType.FII]: 8_000
}

export interface SyncJobSource {
  assetId: string
  ticker: string
  userId: string
  categoryId: string
  categoryType: CategoryType
  currency: string
}

export interface SyncJob {
  name: string
  data: SyncAssetDividendsPayload
  opts?: { delay: number }
}

/**
 * Deduplica por ticker + tipo (uma chamada externa atende todos os ativos
 * iguais) e espaça os jobs de cada provider para respeitar seus rate limits.
 * `since` ativa o modo backfill (ver `SyncAssetDividendsPayload`).
 */
export function buildSyncJobs(
  sources: SyncJobSource[],
  since?: Date
): SyncJob[] {
  const tickerMap = new Map<string, SyncAssetDividendsPayload>()

  for (const source of sources) {
    if (
      !source.ticker ||
      PROVIDER_DELAY_MS[source.categoryType] === undefined
    ) {
      continue
    }

    const ticker = source.ticker.trim().toUpperCase()
    const key = `${ticker}_${source.categoryType}`

    if (!tickerMap.has(key)) {
      tickerMap.set(key, {
        ticker,
        categoryType: source.categoryType,
        targets: [],
        ...(since && { since: since.toISOString() })
      })
    }

    tickerMap.get(key)?.targets.push({
      assetId: source.assetId,
      userId: source.userId,
      categoryId: source.categoryId,
      currency: source.currency
    })
  }

  const providerIndex: Partial<Record<CategoryType, number>> = {}

  return Array.from(tickerMap.values()).map((data) => {
    const index = providerIndex[data.categoryType] ?? 0
    providerIndex[data.categoryType] = index + 1
    const delay = index * (PROVIDER_DELAY_MS[data.categoryType] ?? 0)

    return {
      name: JOBS.DIVIDEND.SYNC,
      data,
      ...(delay > 0 && { opts: { delay } })
    }
  })
}
