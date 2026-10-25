import { Injectable, Logger } from '@nestjs/common'

import {
  BenchmarkDataGateway,
  BenchmarkType
} from '@/core/http/external/benchmark/benchmark-data.gateway'
import {
  addMonths,
  lastClosedMonth,
  type MonthRef,
  monthIndex
} from '@/core/utils/month'

import { BenchmarkReturnRepository } from '../../domain/benchmark-return.repository'

/** Evita martelar o provider quando ele não tem (ou não entrega) um mês */
const RETRY_COOLDOWN_MS = 60 * 60 * 1000

@Injectable()
export class SyncBenchmarksUseCase {
  private readonly logger = new Logger(SyncBenchmarksUseCase.name)
  private readonly lastAttempt = new Map<BenchmarkType, number>()

  constructor(
    private readonly benchmarkRepository: BenchmarkReturnRepository,
    private readonly benchmarkGateway: BenchmarkDataGateway
  ) {}

  /** Busca e grava os benchmarks a partir de `since` (idempotente) */
  async execute(
    since: MonthRef = addMonths(lastClosedMonth(), -23),
    benchmarks: BenchmarkType[] = Object.values(BenchmarkType)
  ): Promise<void> {
    for (const benchmark of benchmarks) {
      const returns = await this.benchmarkGateway.fetchMonthlyReturns(
        benchmark,
        since
      )

      if (!returns) {
        this.logger.warn(`Could not sync benchmark ${benchmark}`)
        continue
      }

      await this.benchmarkRepository.upsertMany(
        returns.map((item) => ({ ...item, benchmark }))
      )

      this.logger.log(`Synced ${returns.length} months of ${benchmark}`)
    }
  }

  /**
   * Garante que os meses fechados desde `since` estão gravados, buscando só os
   * benchmarks que têm buraco. Falhas não propagam: a consulta segue com o que
   * houver e tenta de novo depois do cooldown.
   */
  async ensureCovered(since: MonthRef, now = Date.now()): Promise<void> {
    const lastClosed = lastClosedMonth()

    if (monthIndex(since) > monthIndex(lastClosed)) {
      return
    }

    const stored = await this.benchmarkRepository.list({
      from: since,
      to: lastClosed
    })
    const expected = monthIndex(lastClosed) - monthIndex(since) + 1

    const missing = Object.values(BenchmarkType).filter((benchmark) => {
      const count = stored.filter((item) => item.benchmark === benchmark).length
      const lastTry = this.lastAttempt.get(benchmark) ?? 0

      return count < expected && now - lastTry > RETRY_COOLDOWN_MS
    })

    if (missing.length === 0) {
      return
    }

    for (const benchmark of missing) {
      this.lastAttempt.set(benchmark, now)
    }

    try {
      await this.execute(since, missing)
    } catch (error) {
      this.logger.error(
        'Failed to backfill benchmarks',
        error instanceof Error ? error.stack : error
      )
    }
  }
}
