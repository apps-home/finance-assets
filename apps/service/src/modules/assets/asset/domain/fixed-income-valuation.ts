import type { IndicatorRate } from '@/core/http/external/indicators/indicator-data.gateway'
import {
  DAY_MS,
  daysInMonthUtc,
  firstOfMonthUtc,
  startOfDayUtc
} from '@/core/utils/utc-date'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export enum FixedIncomeIndexer {
  /** `indexerRate` = % do CDI (110 = 110% do CDI) */
  CDI = 'CDI',
  /** `indexerRate` = taxa real ao ano, somada ao IPCA */
  IPCA = 'IPCA',
  /** `indexerRate` = taxa prefixada ao ano */
  PRE = 'PRE'
}

export interface FixedIncomeTerms {
  indexer: FixedIncomeIndexer
  indexerRate: number
  investedAt: Date
  maturityAt: Date | null
}

/**
 * Indexador só vale para renda fixa, e CDI/IPCA só para categoria em reais.
 * Devolve a mensagem do erro ou null quando a combinação é válida.
 */
export function checkIndexerForCategory(
  indexer: FixedIncomeIndexer | null | undefined,
  category: { type: CategoryType; currency: string }
): string | null {
  if (!indexer) return null

  if (category.type !== CategoryType.FIXED) {
    return 'Only fixed income assets can have an indexer'
  }

  if (indexer !== FixedIncomeIndexer.PRE && category.currency !== 'BRL') {
    return 'CDI and IPCA indexers need a BRL category'
  }

  return null
}

const BUSINESS_DAYS_PER_YEAR = 252

/**
 * Tolerância de cobertura da série do CDI: o início pode cair em fim de
 * semana/feriado e o CDI do dia só sai no dia útil seguinte.
 */
const MAX_COVERAGE_GAP_DAYS = 5

/**
 * Fator acumulado de um título (saldo bruto ÷ valor aplicado) da aplicação até
 * `now`, ou até o vencimento se já passou. Os dias úteis vêm da própria série
 * do CDI, que o Banco Central só publica em dia útil, então não há tabela de
 * feriados. É uma estimativa: o extrato do banco pode diferir por arredondamento
 * e, no IPCA+, pela projeção do mês que ainda não foi divulgado.
 *
 * Devolve null quando a série não cobre o período (melhor não atualizar do que
 * calcular com dias faltando).
 */
export function calcFixedIncomeFactor(
  terms: FixedIncomeTerms,
  cdi: IndicatorRate[],
  ipca: IndicatorRate[],
  now: Date = new Date()
): number | null {
  const start = startOfDayUtc(terms.investedAt)
  const today = startOfDayUtc(now)
  const end =
    terms.maturityAt && startOfDayUtc(terms.maturityAt) < today
      ? startOfDayUtc(terms.maturityAt)
      : today

  if (end <= start) return 1

  if (!coversPeriod(cdi, start, end)) return null

  // Cada taxa diária rende do dia dela até o dia útil seguinte
  const businessDays = cdi.filter(
    (rate) => rate.date >= start && rate.date < end
  )
  const rate = terms.indexerRate / 100

  switch (terms.indexer) {
    case FixedIncomeIndexer.CDI:
      return businessDays.reduce(
        (factor, day) => factor * (1 + (day.ratePct / 100) * rate),
        1
      )

    case FixedIncomeIndexer.PRE:
      return (1 + rate) ** (businessDays.length / BUSINESS_DAYS_PER_YEAR)

    case FixedIncomeIndexer.IPCA: {
      const inflation = calcIpcaFactor(ipca, start, end)

      if (inflation === null) return null

      return (
        inflation * (1 + rate) ** (businessDays.length / BUSINESS_DAYS_PER_YEAR)
      )
    }
  }
}

function coversPeriod(cdi: IndicatorRate[], start: Date, end: Date): boolean {
  const first = cdi[0]?.date
  const last = cdi[cdi.length - 1]?.date

  if (!first || !last) return false

  return (
    first.getTime() - start.getTime() <= MAX_COVERAGE_GAP_DAYS * DAY_MS &&
    end.getTime() - last.getTime() <= MAX_COVERAGE_GAP_DAYS * DAY_MS
  )
}

/**
 * IPCA acumulado entre `start` e `end`, pro rata pelos dias corridos de cada
 * mês. Mês ainda não divulgado usa o último IPCA publicado como projeção.
 */
function calcIpcaFactor(
  ipca: IndicatorRate[],
  start: Date,
  end: Date
): number | null {
  if (ipca.length === 0) return null

  const byMonth = new Map(
    ipca.map((rate) => [firstOfMonthUtc(rate.date).getTime(), rate.ratePct])
  )
  const latest = ipca[ipca.length - 1]
  let factor = 1

  for (
    let month = firstOfMonthUtc(start);
    month < end;
    month = firstOfMonthUtc(month, 1)
  ) {
    const nextMonth = firstOfMonthUtc(month, 1)
    const from = start > month ? start : month
    const to = end < nextMonth ? end : nextMonth
    const days = (to.getTime() - from.getTime()) / DAY_MS
    const published = byMonth.get(month.getTime())
    const monthlyPct =
      published ?? (month > latest.date ? latest.ratePct : undefined)

    // Mês anterior ao primeiro IPCA gravado: não dá para estimar
    if (monthlyPct === undefined) return null

    factor *= (1 + monthlyPct / 100) ** (days / daysInMonthUtc(month))
  }

  return factor
}
