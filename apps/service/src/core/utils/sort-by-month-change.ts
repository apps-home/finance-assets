export type SortOrder = 'asc' | 'desc'

export function calcMonthChange(
  current: number | null | undefined,
  lastMonth: number | null | undefined
): number | null {
  if (current == null || lastMonth == null || lastMonth === 0) return null

  return ((current - lastMonth) / lastMonth) * 100
}

export function sortByMonthChange<T>(
  items: T[],
  getChange: (item: T) => number | null,
  order: SortOrder = 'asc'
): T[] {
  const direction = order === 'asc' ? 1 : -1

  return items
    .map((item, index) => ({ item, index, change: getChange(item) }))
    .sort((a, b) => {
      if (a.change === null && b.change === null) return a.index - b.index
      if (a.change === null) return 1
      if (b.change === null) return -1
      if (a.change === b.change) return a.index - b.index

      return (a.change - b.change) * direction
    })
    .map(({ item }) => item)
}
