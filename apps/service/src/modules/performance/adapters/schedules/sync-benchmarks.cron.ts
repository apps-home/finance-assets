import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { addMonths, lastClosedMonth } from '@/core/utils/month'

import { SyncBenchmarksUseCase } from '../../application/use-cases/sync-benchmarks'

@Injectable()
export class SyncBenchmarksCron {
  private readonly logger = new Logger(SyncBenchmarksCron.name)
  private isRunning = false

  constructor(private readonly syncBenchmarksUseCase: SyncBenchmarksUseCase) {}

  // Dias 1 a 5 de cada mês às 10:00 (America/Sao_Paulo): o CDI e os índices do
  // mês anterior podem demorar a fechar, e a execução é idempotente.
  @Cron('0 10 1-5 * *', { timeZone: 'America/Sao_Paulo' })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    try {
      // Reprocessa os últimos 3 meses para absorver revisões
      await this.syncBenchmarksUseCase.execute(addMonths(lastClosedMonth(), -2))
    } catch (error) {
      this.logger.error(
        'Failed to sync benchmarks',
        error instanceof Error ? error.stack : error
      )
    } finally {
      this.isRunning = false
    }
  }
}
