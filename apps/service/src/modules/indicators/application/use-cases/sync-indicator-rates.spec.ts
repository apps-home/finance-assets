import { InMemoryIndicatorRateRepository } from '@test/repositories/in-memory-indicator-rate.repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  EconomicIndicator,
  type IndicatorDataGateway,
  type IndicatorRate
} from '@/core/http/external/indicators/indicator-data.gateway'
import { addDaysUtc } from '@/core/utils/utc-date'

import { SyncIndicatorRatesUseCase } from './sync-indicator-rates'

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`)
const HOUR = 60 * 60 * 1000

/** Último CDI publicado (sexta) e último IPCA (setembro), vistos na segunda 26/10 */
const LAST_CDI = day('2026-10-23')
const LAST_IPCA = day('2026-09-01')

/** CDI em todo dia de semana e IPCA no dia 1º de cada mês já publicado */
function seriesBetween(
  indicator: EconomicIndicator,
  from: Date,
  to: Date
): IndicatorRate[] {
  const rates: IndicatorRate[] = []

  for (let date = from; date <= to; date = addDaysUtc(date, 1)) {
    const weekday = date.getUTCDay()
    const isRateDay =
      indicator === EconomicIndicator.CDI
        ? weekday !== 0 && weekday !== 6 && date <= LAST_CDI
        : date.getUTCDate() === 1 && date <= LAST_IPCA

    if (isRateDay) rates.push({ date, ratePct: 0.05 })
  }

  return rates
}

describe('SyncIndicatorRatesUseCase', () => {
  let repository: InMemoryIndicatorRateRepository
  let fetchRates: ReturnType<typeof vi.fn>
  let sut: SyncIndicatorRatesUseCase
  // Segunda-feira
  const now = new Date('2026-10-26T15:00:00Z')

  beforeEach(() => {
    repository = new InMemoryIndicatorRateRepository()
    fetchRates = vi.fn(
      async (indicator: EconomicIndicator, from: Date, to: Date) =>
        seriesBetween(indicator, from, to)
    )
    sut = new SyncIndicatorRatesUseCase(repository, {
      fetchRates
    } as unknown as IndicatorDataGateway)
  })

  function cdiCalls() {
    return fetchRates.mock.calls
      .filter(([indicator]) => indicator === EconomicIndicator.CDI)
      .map(([, from, to]) => [
        (from as Date).toISOString().slice(0, 10),
        (to as Date).toISOString().slice(0, 10)
      ])
  }

  it('should fetch from the start date to today, one year at a time', async () => {
    await sut.ensureCovered(day('2025-06-10'), now)

    expect(cdiCalls()).toEqual([
      ['2025-06-10', '2025-12-31'],
      ['2026-01-01', '2026-10-26']
    ])
    expect(await repository.bounds(EconomicIndicator.IPCA)).toEqual({
      first: day('2025-06-01'),
      last: day('2026-09-01')
    })
  })

  it('should not call the provider when the range is covered', async () => {
    await sut.ensureCovered(day('2026-01-05'), now)
    fetchRates.mockClear()

    await sut.ensureCovered(day('2026-03-02'), now)

    expect(fetchRates).not.toHaveBeenCalled()
  })

  it('should fill an older start backwards, newest year first', async () => {
    await sut.ensureCovered(day('2026-01-05'), now)
    fetchRates.mockClear()

    await sut.ensureCovered(day('2024-03-01'), now)

    expect(cdiCalls()).toEqual([
      ['2026-01-01', '2026-01-04'],
      ['2025-01-01', '2025-12-31'],
      ['2024-03-01', '2024-12-31']
    ])
  })

  it('should keep the stored series contiguous when a backwards part fails', async () => {
    await sut.ensureCovered(day('2026-01-05'), now)
    fetchRates.mockImplementation(
      async (indicator: EconomicIndicator, from: Date, to: Date) =>
        from.getUTCFullYear() === 2024
          ? null
          : seriesBetween(indicator, from, to)
    )

    await sut.ensureCovered(day('2024-03-01'), now)

    // 2025 entrou, 2024 falhou: a série começa no 1º dia útil de 2025
    expect((await repository.bounds(EconomicIndicator.CDI))?.first).toEqual(
      day('2025-01-01')
    )
  })

  it('should not fetch again a backwards range that had no business day', async () => {
    // Sábado e domingo antes do primeiro dia útil gravado
    await sut.ensureCovered(day('2026-10-05'), now)
    fetchRates.mockClear()

    await sut.ensureCovered(day('2026-10-03'), now)
    await sut.ensureCovered(day('2026-10-03'), now)

    expect(cdiCalls()).toEqual([['2026-10-03', '2026-10-04']])
  })

  it('should wait the cooldown before looking for new rates again', async () => {
    await sut.ensureCovered(day('2026-10-01'), now)
    // Na terça falta o CDI de sexta em diante: busca uma vez e espera o cooldown
    const tuesday = new Date('2026-10-27T15:00:00Z')
    fetchRates.mockClear()

    await sut.ensureCovered(day('2026-10-01'), tuesday)
    await sut.ensureCovered(
      day('2026-10-01'),
      new Date(tuesday.getTime() + HOUR)
    )

    expect(cdiCalls()).toEqual([['2026-10-24', '2026-10-27']])
  })

  it('should not throw when the provider fails', async () => {
    fetchRates.mockResolvedValue(null)

    await expect(
      sut.ensureCovered(day('2026-01-05'), now)
    ).resolves.toBeUndefined()
    expect(repository.items).toEqual([])
  })
})
