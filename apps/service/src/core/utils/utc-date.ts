export const DAY_MS = 24 * 60 * 60 * 1000

/** Dia de calendário (00:00 UTC) */
export function startOfDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}

export function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Dia 1º do mês (00:00 UTC), com `months` meses de deslocamento */
export function firstOfMonthUtc(date: Date, months = 0): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
  )
}

export function daysInMonthUtc(date: Date): number {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  ).getUTCDate()
}
