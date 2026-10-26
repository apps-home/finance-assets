import { InMemoryMarketAssetRepository } from '@test/repositories/in-memory-market-asset.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { ResolveMarketAssetUseCase } from './resolve-market-asset'

describe('ResolveMarketAssetUseCase', () => {
  let repository: InMemoryMarketAssetRepository
  let sut: ResolveMarketAssetUseCase

  beforeEach(() => {
    repository = new InMemoryMarketAssetRepository()
    sut = new ResolveMarketAssetUseCase(repository)
  })

  it('should create the market asset with the normalized ticker', async () => {
    const result = await sut.execute({
      ticker: ' wege3 ',
      type: CategoryType.VARIABLE_BR,
      name: 'Weg'
    })

    expect(result.value).toMatchObject({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR
    })
    expect(repository.items).toHaveLength(1)
  })

  it('should reuse the same ticker and type', async () => {
    const first = await sut.execute({
      ticker: 'WEGE3',
      type: CategoryType.VARIABLE_BR,
      name: 'Weg'
    })
    const second = await sut.execute({
      ticker: 'wege3',
      type: CategoryType.VARIABLE_BR,
      name: 'WEG ON'
    })

    expect(second.value?.id).toBe(first.value?.id)
    expect(repository.items).toHaveLength(1)
  })

  it('should keep the same ticker of another type apart', async () => {
    await sut.execute({ ticker: 'BTC', type: CategoryType.CRYPTO, name: 'BTC' })
    await sut.execute({
      ticker: 'BTC',
      type: CategoryType.VARIABLE_US,
      name: 'BTC ETF'
    })

    expect(repository.items).toHaveLength(2)
  })

  it.each([
    { ticker: 'TESOURO', type: CategoryType.FIXED },
    { ticker: '  ', type: CategoryType.VARIABLE_BR }
  ])('should not catalog $type with ticker "$ticker"', async (payload) => {
    const result = await sut.execute({ ...payload, name: 'Ativo' })

    expect(result.value).toBeNull()
    expect(repository.items).toHaveLength(0)
  })
})
