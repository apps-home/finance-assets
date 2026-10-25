import { Injectable } from '@nestjs/common'

import { DomainJobPublisher } from '@/core/domain/queue/domain-job-publisher.interface'
import { QUEUES } from '@/core/domain/queue/queue.constants'
import { Either, right } from '@/core/utils/Either'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'

import { buildSyncJobs } from '../../adapters/build-sync-jobs'

type BackfillDividendsResponse = Either<Error, { enqueued: number }>

export const DEFAULT_BACKFILL_MONTHS = 12

/**
 * Importa o histórico recente de proventos dos ativos ativos do usuário.
 * Enfileira os mesmos jobs do sync semanal (respeitando os rate limits dos
 * providers), em modo backfill: ignora a data de cadastro do ativo e usa a
 * quantidade atual. Ativos já importados (`dividendsImportedAt`) são pulados:
 * só entram os ainda não importados.
 */
@Injectable()
export class BackfillDividendsUseCase {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly jobPublisher: DomainJobPublisher
  ) {}

  async execute(
    userId: string,
    months: number = DEFAULT_BACKFILL_MONTHS
  ): Promise<BackfillDividendsResponse> {
    const now = new Date()
    const since = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - months,
        now.getUTCDate()
      )
    )

    const items = await this.assetRepository.list({
      userId,
      status: 'ACTIVE'
    })

    const jobs = buildSyncJobs(
      items
        .filter(({ asset }) => !asset.dividendsImportedAt)
        .map(({ asset, category }) => ({
          assetId: asset.id,
          ticker: asset.ticker,
          userId,
          categoryId: category.id,
          categoryType: category.type,
          currency: category.currency
        })),
      since
    )

    if (jobs.length > 0) {
      await this.jobPublisher.publishBulk(QUEUES.DIVIDEND_PROCESSING, jobs)
    }

    return right({ enqueued: jobs.length })
  }
}
