import { describe, expect, it } from 'vitest'

import { calcMonthChange, sortByMonthChange } from './sort-by-month-change'

describe('calcMonthChange', () => {
  it('should return the percentage change', () => {
    expect(calcMonthChange(110, 100)).toBeCloseTo(10)
    expect(calcMonthChange(90, 100)).toBeCloseTo(-10)
  })

  it('should return null when there is no comparison', () => {
    expect(calcMonthChange(null, 100)).toBeNull()
    expect(calcMonthChange(100, null)).toBeNull()
    expect(calcMonthChange(100, 0)).toBeNull()
  })
})

describe('sortByMonthChange', () => {
  const items = [
    { name: 'A', change: 5 },
    { name: 'B', change: null },
    { name: 'C', change: -8 },
    { name: 'D', change: 12 }
  ]
  const names = (list: typeof items) => list.map((item) => item.name)

  it('should sort ascending (biggest drop first) with nulls last', () => {
    const result = sortByMonthChange(items, (item) => item.change, 'asc')

    expect(names(result)).toEqual(['C', 'A', 'D', 'B'])
  })

  it('should sort descending (biggest rise first) with nulls last', () => {
    const result = sortByMonthChange(items, (item) => item.change, 'desc')

    expect(names(result)).toEqual(['D', 'A', 'C', 'B'])
  })

  it('should keep the original order on ties and not mutate the input', () => {
    const tied = [
      { name: 'X', change: 1 },
      { name: 'Y', change: 1 }
    ]
    const result = sortByMonthChange(tied, (item) => item.change, 'desc')

    expect(names(result)).toEqual(['X', 'Y'])
    expect(names(items)).toEqual(['A', 'B', 'C', 'D'])
  })
})
