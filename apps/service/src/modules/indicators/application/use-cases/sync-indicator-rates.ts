import { Injectable, Logger } from '@nestjs/common'

import {
  EconomicIndicator,
  IndicatorDataGateway
} from '@/core/http/external/indicators/indicator-data.gateway'
import {
  addDaysUtc,
  firstOfMonthUtc,
  startOfDayUtc
} from '@/core/utils/utc-date'

import { IndicatorRateRepository } from '../../domain/indicator-rate.repository'

/**
 * Depois de uma busca por dados novos, espera isso para repetir: o CDI do dia
 * só sai no dia útil seguinte e o IPCA do mês, por volta do dia 10 do próximo.
 */
const FORWARD_COOLDOWN_MS = 6 * 60 * 60 * 1000

/**
 * Mantém o cache local de CDI diário e IPCA mensal, buscando no Banco Central
 * só o que falta, um ano por vez (o SGS falha em intervalos longos).
 */
@Injectable()
export class SyncIndicatorRatesUseCase {
  private readonly logger = new Logger(SyncIndicatorRatesUseCase.name)
  private readonly lastForwardAttempt = new Map<EconomicIndicator, number>()
  /** Início mais antigo já buscado para trás (o trecho antes do 1º dia útil fica vazio) */
  private readonly checkedFrom = new Map<EconomicIndicator, number>()

  constructor(
    private readonly indicatorRateRepository: IndicatorRateRepository,
    private readonly indicatorDataGateway: IndicatorDataGateway
  ) {}

  /**
   * Garante CDI e IPCA gravados de `since` até hoje. Falhas não propagam: quem
   * chama segue com o que houver (e o cálculo recusa períodos sem cobertura).
   */
  async ensureCovered(since: Date, now: Date = new Date()): Promise<void> {
    for (const indicator of Object.values(EconomicIndicator)) {
      try {
        await this.cover(indicator, since, now)
      } catch (error) {
        this.logger.error(
          `Failed to sync ${indicator}`,
          error instanceof Error ? error.stack : error
        )
      }
    }
  }

  private async cover(
    indicator: EconomicIndicator,
    since: Date,
    now: Date
  ): Promise<void> {
    const today = startOfDayUtc(now)
    const start =
      indicator === EconomicIndicator.IPCA
        ? firstOfMonthUtc(since)
        : startOfDayUtc(since)
    const bounds = await this.indicatorRateRepository.bounds(indicator)

    if (!bounds) {
      if (this.canFetchForward(indicator, now)) {
        await this.fetchRange(indicator, start, today, 'forward')
      }
      return
    }

    const checkedFrom = this.checkedFrom.get(indicator) ?? Infinity

    if (start < bounds.first && start.getTime() < checkedFrom) {
      const complete = await this.fetchRange(
        indicator,
        start,
        addDaysUtc(bounds.first, -1),
        'backward'
      )

      if (complete) this.checkedFrom.set(indicator, start.getTime())
    }

    if (
      this.isStale(indicator, bounds.last, today) &&
      this.canFetchForward(indicator, now)
    ) {
      await this.fetchRange(
        indicator,
        addDaysUtc(bounds.last, 1),
        today,
        'forward'
      )
    }
  }

  /** Falta o último valor que já deveria ter sido publicado */
  private isStale(
    indicator: EconomicIndicator,
    last: Date,
    today: Date
  ): boolean {
    return indicator === EconomicIndicator.IPCA
      ? last < firstOfMonthUtc(today, -1)
      : last < addDaysUtc(today, -1)
  }

  private canFetchForward(indicator: EconomicIndicator, now: Date): boolean {
    const lastTry = this.lastForwardAttempt.get(indicator) ?? 0

    if (now.getTime() - lastTry < FORWARD_COOLDOWN_MS) return false

    this.lastForwardAttempt.set(indicator, now.getTime())
    return true
  }

  /**
   * Busca um ano por vez e grava cada parte. Para frente vai do mais antigo ao
   * mais novo e, para trás, ao contrário: se uma parte falhar, o que ficou
   * gravado continua sem buracos. Devolve se todas as partes vieram.
   */
  private async fetchRange(
    indicator: EconomicIndicator,
    from: Date,
    to: Date,
    direction: 'forward' | 'backward'
  ): Promise<boolean> {
    if (from > to) return true

    const chunks = yearChunks(from, to)

    if (direction === 'backward') chunks.reverse()

    for (const chunk of chunks) {
      const rates = await this.indicatorDataGateway.fetchRates(
        indicator,
        chunk.from,
        chunk.to
      )

      if (!rates) {
        this.logger.warn(
          `Could not fetch ${indicator} from ${chunk.from.toISOString().slice(0, 10)} to ${chunk.to.toISOString().slice(0, 10)}`
        )
        return false
      }

      await this.indicatorRateRepository.saveMany(indicator, rates)
    }

    return true
  }
}

function yearChunks(from: Date, to: Date): Array<{ from: Date; to: Date }> {
  const chunks: Array<{ from: Date; to: Date }> = []

  for (let year = from.getUTCFullYear(); year <= to.getUTCFullYear(); year++) {
    const yearStart = new Date(Date.UTC(year, 0, 1))
    const yearEnd = new Date(Date.UTC(year, 11, 31))

    chunks.push({
      from: from > yearStart ? from : yearStart,
      to: to < yearEnd ? to : yearEnd
    })
  }

  return chunks
}
