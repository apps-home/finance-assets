import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { RevalueFixedIncomeUseCase } from '../../application/use-cases/revalue-fixed-income'

@Injectable()
export class RevalueFixedIncomeCron {
  private readonly logger = new Logger(RevalueFixedIncomeCron.name)
  private isRunning = false

  constructor(
    private readonly revalueFixedIncomeUseCase: RevalueFixedIncomeUseCase
  ) {}

  /**
   * Terça a sábado às 10:00 (horário de Brasília): o CDI de cada dia útil sai
   * no dia útil seguinte, então segunda não tem dado novo.
   */
  @Cron('0 10 * * 2-6', {
    timeZone: 'America/Sao_Paulo'
  })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Fixed income revaluation cron job is already running.')
      return
    }

    this.isRunning = true

    try {
      const { updated, skipped } =
        await this.revalueFixedIncomeUseCase.executeForAll()

      this.logger.log(
        `Fixed income revalued: ${updated} updated, ${skipped} without CDI/IPCA coverage.`
      )
    } catch (error) {
      this.logger.error(
        'Failed to revalue fixed income assets',
        error instanceof Error ? error.stack : error
      )
    } finally {
      this.isRunning = false
    }
  }
}
