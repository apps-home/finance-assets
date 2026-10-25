import { describe, expect, it } from 'vitest'

import {
  buildPerformance,
  buildPortfolioReturns,
  calcBeta,
  calcModifiedDietz,
  compound,
  type PortfolioRecord
} from './performance-calculator'

function record(
  categoryId: string,
  year: number,
  month: number,
  amount: number,
  extra: Partial<PortfolioRecord> = {}
): PortfolioRecord {
  return {
    categoryId,
    year,
    month,
    amount,
    contribution: 0,
    dividends: 0,
    ...extra
  }
}

describe('calcModifiedDietz', () => {
  it('calcula o retorno sem fluxos', () => {
    expect(
      calcModifiedDietz({
        startValue: 1000,
        endValue: 1100,
        contribution: 0,
        dividends: 0
      })
    ).toBeCloseTo(10)
  })

  it('não conta o aporte como rentabilidade', () => {
    // 1000 -> 1600 com 500 de aporte: ganho de 100 sobre 1250
    expect(
      calcModifiedDietz({
        startValue: 1000,
        endValue: 1600,
        contribution: 500,
        dividends: 0
      })
    ).toBeCloseTo(8)
  })

  it('soma proventos ao ganho', () => {
    expect(
      calcModifiedDietz({
        startValue: 1000,
        endValue: 1000,
        contribution: 0,
        dividends: 10
      })
    ).toBeCloseTo(1)
  })

  it('devolve null quando não há base de cálculo', () => {
    expect(
      calcModifiedDietz({
        startValue: 0,
        endValue: 100,
        contribution: 0,
        dividends: 0
      })
    ).toBeNull()
  })
})

describe('compound', () => {
  it('encadeia retornos mensais', () => {
    expect(compound([10, 10])).toBeCloseTo(21)
    expect(compound([])).toBeCloseTo(0)
  })
})

describe('buildPortfolioReturns', () => {
  it('soma as categorias e usa o aporte informado', () => {
    const returns = buildPortfolioReturns([
      record('a', 2025, 1, 1000),
      record('b', 2025, 1, 1000),
      record('a', 2025, 2, 1100, { contribution: 100 }),
      record('b', 2025, 2, 1000)
    ])

    // 2000 -> 2100 com 100 de aporte: ganho 0
    expect(returns).toHaveLength(1)
    expect(returns[0]).toMatchObject({ year: 2025, month: 2 })
    expect(returns[0].value).toBeCloseTo(0)
  })

  it('ignora meses que não são consecutivos', () => {
    expect(
      buildPortfolioReturns([
        record('a', 2025, 1, 1000),
        record('a', 2025, 3, 1100)
      ])
    ).toEqual([])
  })

  it('descarta o par quando falta uma categoria que já existia', () => {
    expect(
      buildPortfolioReturns([
        record('a', 2025, 1, 1000),
        record('b', 2025, 1, 1000),
        record('a', 2025, 2, 1000)
      ])
    ).toEqual([])
  })

  it('trata categoria nova como aporte inteiro do mês', () => {
    const returns = buildPortfolioReturns([
      record('a', 2025, 1, 1000),
      record('a', 2025, 2, 1000),
      record('b', 2025, 2, 500)
    ])

    expect(returns[0].value).toBeCloseTo(0)
  })

  it('atravessa a virada de ano', () => {
    const returns = buildPortfolioReturns([
      record('a', 2025, 12, 1000),
      record('a', 2026, 1, 1010)
    ])

    expect(returns[0]).toMatchObject({ year: 2026, month: 1 })
    expect(returns[0].value).toBeCloseTo(1)
  })
})

describe('calcBeta', () => {
  it('exige amostras mínimas', () => {
    expect(calcBeta([1, 2], [1, 2])).toBeNull()
  })

  it('calcula o beta de uma série proporcional', () => {
    const x = Array.from({ length: 12 }, (_, i) => i - 6)
    const y = x.map((v) => v * 0.5)

    expect(calcBeta(x, y)).toBeCloseTo(0.5)
  })
})

describe('buildPerformance', () => {
  const portfolio = [
    { year: 2025, month: 1, value: 2 },
    { year: 2025, month: 2, value: 1 }
  ]

  it('monta a série acumulada com ponto base em 0%', () => {
    const { series } = buildPerformance(portfolio, {
      cdi: [
        { year: 2025, month: 1, value: 1 },
        { year: 2025, month: 2, value: 1 }
      ],
      ibov: [],
      sp500: []
    })

    expect(series[0]).toMatchObject({ year: 2024, month: 12, portfolio: 0 })
    expect(series[2].portfolio).toBeCloseTo(3.02)
    expect(series[2].cdi).toBeCloseTo(2.01)
    expect(series[2].ibov).toBeNull()
  })

  it('anula o benchmark a partir do primeiro mês sem dado', () => {
    const { series } = buildPerformance(portfolio, {
      cdi: [{ year: 2025, month: 2, value: 1 }],
      ibov: [],
      sp500: []
    })

    expect(series[1].cdi).toBeNull()
    expect(series[2].cdi).toBeNull()
  })

  it('calcula alpha por período', () => {
    const { periods } = buildPerformance(portfolio, {
      cdi: [
        { year: 2025, month: 1, value: 1 },
        { year: 2025, month: 2, value: 1 }
      ],
      ibov: [],
      sp500: []
    })

    const all = periods.find((p) => p.period === 'all')

    expect(all?.months).toBe(2)
    expect(all?.alphaCdi).toBeCloseTo(3.02 - 2.01)
    expect(all?.alphaIbov).toBeNull()
  })

  it('devolve vazio sem retornos', () => {
    expect(buildPerformance([], { cdi: [], ibov: [], sp500: [] })).toEqual({
      series: [],
      periods: [],
      betaIbov: null
    })
  })
})
