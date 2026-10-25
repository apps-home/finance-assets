import {
  addMonths,
  fromMonthIndex,
  type MonthRef,
  monthIndex
} from '@/core/utils/month'

export type BenchmarkKey = 'cdi' | 'ibov' | 'sp500'

export const BENCHMARK_KEYS: BenchmarkKey[] = ['cdi', 'ibov', 'sp500']

/** Registro mensal de uma categoria, com tudo já em R$ */
export interface PortfolioRecord extends MonthRef {
  categoryId: string
  amount: number
  /** Aporte líquido do mês (negativo = resgate) */
  contribution: number
  dividends: number
}

export interface MonthlyReturn extends MonthRef {
  /** Retorno do mês em % */
  value: number
}

/**
 * Retorno do mês pelo método de Modified Dietz, em %.
 * Os aportes entram na metade do mês; os proventos somam ao ganho
 * (retorno total), tenham sido reinvestidos ou não.
 */
export function calcModifiedDietz(input: {
  startValue: number
  endValue: number
  contribution: number
  dividends: number
}): number | null {
  const { startValue, endValue, contribution, dividends } = input
  const base = startValue + contribution / 2

  if (base <= 0) {
    return null
  }

  const gain = endValue - startValue - contribution + dividends

  return (gain / base) * 100
}

export function compound(returnsPct: number[]): number {
  return (
    (returnsPct.reduce((acc, value) => acc * (1 + value / 100), 1) - 1) * 100
  )
}

interface MonthSnapshot {
  total: number
  dividends: number
  /** categoria -> { amount, contribution } */
  categories: Map<string, { amount: number; contribution: number }>
}

/**
 * Retornos mensais da carteira consolidada (todas as categorias).
 *
 * Só calcula pares de meses consecutivos. Se uma categoria que existia no mês
 * anterior não tem registro no mês, o par é descartado (dado incompleto, o
 * saldo cairia sem que houvesse prejuízo). Categoria que aparece pela primeira
 * vez entra inteira como aporte do mês.
 */
export function buildPortfolioReturns(
  records: PortfolioRecord[]
): MonthlyReturn[] {
  const snapshots = new Map<number, MonthSnapshot>()

  for (const record of records) {
    const index = monthIndex(record)
    const snapshot = snapshots.get(index) ?? {
      total: 0,
      dividends: 0,
      categories: new Map()
    }

    snapshot.total += record.amount
    snapshot.dividends += record.dividends
    snapshot.categories.set(record.categoryId, {
      amount: record.amount,
      contribution: record.contribution
    })
    snapshots.set(index, snapshot)
  }

  const returns: MonthlyReturn[] = []

  for (const index of [...snapshots.keys()].sort((a, b) => a - b)) {
    const previous = snapshots.get(index - 1)
    const current = snapshots.get(index)

    if (!previous || !current) {
      continue
    }

    const hasAllPreviousCategories = [...previous.categories.keys()].every(
      (id) => current.categories.has(id)
    )

    if (!hasAllPreviousCategories) {
      continue
    }

    let contribution = 0

    for (const [id, category] of current.categories) {
      contribution += previous.categories.has(id)
        ? category.contribution
        : category.amount
    }

    const value = calcModifiedDietz({
      startValue: previous.total,
      endValue: current.total,
      contribution,
      dividends: current.dividends
    })

    if (value !== null) {
      returns.push({ ...fromMonthIndex(index), value })
    }
  }

  return returns
}

/** Beta de `y` em relação a `x` (covariância / variância). Exige pares suficientes. */
export function calcBeta(
  x: number[],
  y: number[],
  minSamples = 12
): number | null {
  if (x.length !== y.length || x.length < minSamples) {
    return null
  }

  const meanX = x.reduce((a, b) => a + b, 0) / x.length
  const meanY = y.reduce((a, b) => a + b, 0) / y.length

  let covariance = 0
  let variance = 0

  for (let i = 0; i < x.length; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY)
    variance += (x[i] - meanX) ** 2
  }

  return variance === 0 ? null : covariance / variance
}

export interface PerformancePoint extends MonthRef {
  /** Retorno acumulado desde o início da série, em % */
  portfolio: number
  cdi: number | null
  ibov: number | null
  sp500: number | null
}

export type PeriodKey = 'ytd' | '12m' | 'all'

export interface PeriodSummary {
  period: PeriodKey
  months: number
  portfolio: number
  cdi: number | null
  ibov: number | null
  sp500: number | null
  /** Carteira menos benchmark, em pontos percentuais */
  alphaCdi: number | null
  alphaIbov: number | null
  alphaSp500: number | null
}

export interface PerformanceResult {
  series: PerformancePoint[]
  periods: PeriodSummary[]
  betaIbov: number | null
}

type BenchmarkReturns = Record<BenchmarkKey, MonthlyReturn[]>

function toMap(returns: MonthlyReturn[]): Map<number, number> {
  return new Map(returns.map((r) => [monthIndex(r), r.value]))
}

function summarizePeriod(
  period: PeriodKey,
  slice: MonthlyReturn[],
  benchmarks: Record<BenchmarkKey, Map<number, number>>
): PeriodSummary {
  const benchmarkTotal = (key: BenchmarkKey): number | null => {
    const values = slice.map((r) => benchmarks[key].get(monthIndex(r)))

    return values.every((v): v is number => v !== undefined)
      ? compound(values)
      : null
  }

  const portfolio = compound(slice.map((r) => r.value))
  const cdi = benchmarkTotal('cdi')
  const ibov = benchmarkTotal('ibov')
  const sp500 = benchmarkTotal('sp500')
  const alpha = (value: number | null) =>
    value === null ? null : portfolio - value

  return {
    period,
    months: slice.length,
    portfolio,
    cdi,
    ibov,
    sp500,
    alphaCdi: alpha(cdi),
    alphaIbov: alpha(ibov),
    alphaSp500: alpha(sp500)
  }
}

export function buildPerformance(
  portfolioReturns: MonthlyReturn[],
  benchmarkReturns: BenchmarkReturns
): PerformanceResult {
  const portfolio = [...portfolioReturns].sort(
    (a, b) => monthIndex(a) - monthIndex(b)
  )

  if (portfolio.length === 0) {
    return { series: [], periods: [], betaIbov: null }
  }

  const benchmarks = {
    cdi: toMap(benchmarkReturns.cdi),
    ibov: toMap(benchmarkReturns.ibov),
    sp500: toMap(benchmarkReturns.sp500)
  }

  // Ponto base (0%): o mês anterior ao primeiro retorno
  const base = addMonths(portfolio[0], -1)
  const series: PerformancePoint[] = [
    { ...base, portfolio: 0, cdi: 0, ibov: 0, sp500: 0 }
  ]

  const accumulated: Record<'portfolio' | BenchmarkKey, number> = {
    portfolio: 1,
    cdi: 1,
    ibov: 1,
    sp500: 1
  }
  // Benchmark sem dado num mês fica nulo dali em diante (não dá para encadear)
  const broken: Record<BenchmarkKey, boolean> = {
    cdi: false,
    ibov: false,
    sp500: false
  }

  for (const item of portfolio) {
    accumulated.portfolio *= 1 + item.value / 100

    const point: PerformancePoint = {
      year: item.year,
      month: item.month,
      portfolio: (accumulated.portfolio - 1) * 100,
      cdi: null,
      ibov: null,
      sp500: null
    }

    for (const key of BENCHMARK_KEYS) {
      const value = benchmarks[key].get(monthIndex(item))

      if (value === undefined) {
        broken[key] = true
      }

      if (!broken[key] && value !== undefined) {
        accumulated[key] *= 1 + value / 100
        point[key] = (accumulated[key] - 1) * 100
      }
    }

    series.push(point)
  }

  const last = portfolio[portfolio.length - 1]
  const lastIndex = monthIndex(last)

  const periods: PeriodSummary[] = [
    summarizePeriod(
      'ytd',
      portfolio.filter((r) => r.year === last.year),
      benchmarks
    ),
    summarizePeriod(
      '12m',
      portfolio.filter((r) => monthIndex(r) > lastIndex - 12),
      benchmarks
    ),
    summarizePeriod('all', portfolio, benchmarks)
  ]

  const paired = portfolio.flatMap((r) => {
    const ibov = benchmarks.ibov.get(monthIndex(r))

    return ibov === undefined ? [] : [{ x: ibov, y: r.value }]
  })

  return {
    series,
    periods,
    betaIbov: calcBeta(
      paired.map((p) => p.x),
      paired.map((p) => p.y)
    )
  }
}
