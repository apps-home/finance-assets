import {
  monthsToReach,
  type ProjectionInput
} from '@/features/performance/utils/projection'

/** Degraus naturais da evolução patrimonial, em R$ */
export const PATRIMONY_MILESTONES = [
  10_000, 25_000, 50_000, 75_000, 100_000, 150_000, 200_000, 250_000, 500_000,
  750_000, 1_000_000
] as const

/** Sem histórico suficiente, mesma rentabilidade padrão da Projeção */
export const DEFAULT_MILESTONE_RETURN_PCT = 10

/** Aporte extra usado na simulação "e se eu aportar mais" */
export const EXTRA_CONTRIBUTION_SIMULATION = 500

export interface MilestoneProgress {
  /** Último marco já conquistado */
  last: number | null
  /** Próximo marco alvo; null quando todos foram conquistados */
  next: number | null
  /** Quanto falta para o próximo marco */
  remaining: number
  /** Patrimônio / próximo marco, em % (0–100) */
  progressPct: number
  /** Posição do último marco na barra, em % (0–100) */
  lastMarkerPct: number
  /** Marcos já conquistados */
  achieved: number[]
}

export function getMilestoneProgress(wealth: number): MilestoneProgress {
  const achieved = PATRIMONY_MILESTONES.filter((value) => wealth >= value)
  const last = achieved[achieved.length - 1] ?? null
  const next = PATRIMONY_MILESTONES.find((value) => wealth < value) ?? null

  return {
    last,
    next,
    remaining: next === null ? 0 : next - wealth,
    progressPct:
      next === null ? 100 : Math.max(0, Math.min((wealth / next) * 100, 100)),
    lastMarkerPct: next === null || last === null ? 0 : (last / next) * 100,
    achieved: [...achieved]
  }
}

export interface MilestoneProjection {
  /** Meses até o marco no ritmo atual; null se não chega em 100 anos */
  months: number | null
  /** Meses até o marco com o aporte extra simulado */
  monthsWithExtra: number | null
  /** Meses antecipados pelo aporte extra */
  monthsSaved: number | null
}

/** Reaproveita a simulação da Projeção (juros compostos mês a mês) */
export function projectMilestone(
  target: number,
  input: ProjectionInput,
  extraContribution = EXTRA_CONTRIBUTION_SIMULATION
): MilestoneProjection {
  const months = monthsToReach(target, input)
  const monthsWithExtra = monthsToReach(target, {
    ...input,
    monthlyContribution: input.monthlyContribution + extraContribution
  })

  return {
    months,
    monthsWithExtra,
    monthsSaved:
      months !== null && monthsWithExtra !== null
        ? Math.max(months - monthsWithExtra, 0)
        : null
  }
}
