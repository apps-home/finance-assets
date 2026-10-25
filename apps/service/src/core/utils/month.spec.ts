import { describe, expect, it } from 'vitest'

import {
  addMonths,
  fromMonthIndex,
  lastClosedMonth,
  monthIndex,
  parseMonthRef
} from './month'

describe('month utils', () => {
  it('converte de e para índice sequencial', () => {
    const ref = { year: 2026, month: 10 }

    expect(fromMonthIndex(monthIndex(ref))).toEqual(ref)
    expect(monthIndex({ year: 2026, month: 1 })).toBe(
      monthIndex({ year: 2025, month: 12 }) + 1
    )
  })

  it('soma e subtrai meses atravessando o ano', () => {
    expect(addMonths({ year: 2025, month: 12 }, 1)).toEqual({
      year: 2026,
      month: 1
    })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12
    })
    expect(addMonths({ year: 2026, month: 3 }, -14)).toEqual({
      year: 2025,
      month: 1
    })
  })

  it('devolve o último mês fechado em UTC', () => {
    expect(lastClosedMonth(new Date('2026-10-25T12:00:00Z'))).toEqual({
      year: 2026,
      month: 9
    })
    expect(lastClosedMonth(new Date('2026-01-01T00:00:00Z'))).toEqual({
      year: 2025,
      month: 12
    })
  })

  it('valida o formato AAAA-MM', () => {
    expect(parseMonthRef('2026-03')).toEqual({ year: 2026, month: 3 })
    expect(parseMonthRef('2026-13')).toBeNull()
    expect(parseMonthRef('2026-3')).toBeNull()
    expect(parseMonthRef('abc')).toBeNull()
  })
})
