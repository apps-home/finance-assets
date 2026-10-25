export interface MonthRef {
  year: number
  /** 1-12 */
  month: number
}

/** Índice sequencial de meses (ordenável e com aritmética simples) */
export function monthIndex({ year, month }: MonthRef): number {
  return year * 12 + (month - 1)
}

export function fromMonthIndex(index: number): MonthRef {
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  return fromMonthIndex(monthIndex(ref) + delta)
}

/** Último mês completamente encerrado (o mês anterior ao de `now`, em UTC) */
export function lastClosedMonth(now: Date = new Date()): MonthRef {
  return addMonths(
    { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
    -1
  )
}

/** Converte "YYYY-MM" */
export function parseMonthRef(value: string): MonthRef | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value)

  return match ? { year: Number(match[1]), month: Number(match[2]) } : null
}
