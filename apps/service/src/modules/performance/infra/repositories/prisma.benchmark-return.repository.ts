import type { FinanceAssets } from '@lib/finance-assets-db'
import { Inject, Injectable } from '@nestjs/common'

import { BenchmarkType } from '@/core/http/external/benchmark/benchmark-data.gateway'
import { type MonthRef, monthIndex } from '@/core/utils/month'

import {
  BenchmarkReturnRecord,
  BenchmarkReturnRepository
} from '../../domain/benchmark-return.repository'

@Injectable()
export class PrismaBenchmarkReturnRepository
  implements BenchmarkReturnRepository
{
  constructor(@Inject('prismaFinanceAssets') private prisma: FinanceAssets) {}

  async list({
    from,
    to
  }: {
    from: MonthRef
    to: MonthRef
  }): Promise<BenchmarkReturnRecord[]> {
    // Janela por ano e filtro fino em memória (a tabela é pequena)
    const rows = await this.prisma.benchmarkReturn.findMany({
      where: { year: { gte: from.year, lte: to.year } }
    })

    return rows
      .filter((row) => {
        const index = monthIndex(row)

        return index >= monthIndex(from) && index <= monthIndex(to)
      })
      .map((row) => ({
        benchmark: row.benchmark as BenchmarkType,
        year: row.year,
        month: row.month,
        returnPct: Number(row.returnPct)
      }))
  }

  async upsertMany(records: BenchmarkReturnRecord[]): Promise<void> {
    if (records.length === 0) {
      return
    }

    await this.prisma.$transaction(
      records.map((record) =>
        this.prisma.benchmarkReturn.upsert({
          where: {
            benchmark_year_month: {
              benchmark: record.benchmark,
              year: record.year,
              month: record.month
            }
          },
          create: {
            benchmark: record.benchmark,
            year: record.year,
            month: record.month,
            returnPct: record.returnPct
          },
          update: { returnPct: record.returnPct }
        })
      )
    )
  }
}
