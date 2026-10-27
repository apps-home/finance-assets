/** Taxa de retirada segura anual usada na "regra dos 4%" */
export const SAFE_WITHDRAWAL_RATE = 0.04

/** Teto da busca por "quando chega lá", em meses (100 anos) */
const MAX_MONTHS = 1200

export interface ProjectionInput {
  /** Patrimônio de hoje, em R$ */
  initial: number
  /** Aporte por mês, em R$ */
  monthlyContribution: number
  /** Rentabilidade anual esperada, em % (10 = 10% a.a.) */
  annualReturnPct: number
}

export interface ProjectionPoint {
  /** Anos a partir de hoje (0 = hoje) */
  year: number
  /** Patrimônio projetado */
  wealth: number
  /** Quanto disso é dinheiro aportado (inicial + aportes) */
  invested: number
}

/** Rentabilidade anual em taxa mensal equivalente (juros compostos) */
export function monthlyRate(annualReturnPct: number) {
  return (1 + annualReturnPct / 100) ** (1 / 12) - 1
}

/**
 * Evolução ano a ano: rende no mês e o aporte entra no fim dele. Valores
 * nominais, sem descontar a inflação.
 */
export function projectWealth(
  { initial, monthlyContribution, annualReturnPct }: ProjectionInput,
  years: number
): ProjectionPoint[] {
  const rate = monthlyRate(annualReturnPct)
  const points: ProjectionPoint[] = [
    { year: 0, wealth: initial, invested: initial }
  ]

  let wealth = initial
  let invested = initial

  for (let month = 1; month <= years * 12; month++) {
    wealth = wealth * (1 + rate) + monthlyContribution
    invested += monthlyContribution

    if (month % 12 === 0) {
      points.push({ year: month / 12, wealth, invested })
    }
  }

  return points
}

/** Meses até o patrimônio alcançar `target`; null se não chega em 100 anos */
export function monthsToReach(
  target: number,
  { initial, monthlyContribution, annualReturnPct }: ProjectionInput
): number | null {
  if (initial >= target) return 0

  const rate = monthlyRate(annualReturnPct)
  let wealth = initial

  for (let month = 1; month <= MAX_MONTHS; month++) {
    wealth = wealth * (1 + rate) + monthlyContribution
    if (wealth >= target) return month
  }

  return null
}

/**
 * Retorno acumulado de `months` meses (em %) convertido para ao ano. Abaixo
 * de 12 meses a anualização exagera a volatilidade, então devolve null.
 */
export function annualizeReturn(cumulativePct: number, months: number) {
  if (months < 12) return null

  return ((1 + cumulativePct / 100) ** (12 / months) - 1) * 100
}

/** "3 anos e 4 meses", "8 meses", "agora" */
export function formatDuration(months: number) {
  if (months === 0) return 'agora'

  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = [
    years > 0 ? `${years} ${years === 1 ? 'ano' : 'anos'}` : null,
    rest > 0 ? `${rest} ${rest === 1 ? 'mês' : 'meses'}` : null
  ].filter(Boolean)

  return parts.join(' e ')
}

/** Mês/ano em que a meta é atingida, contando de hoje */
export function reachDate(months: number, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth() + months, 1)

  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}
