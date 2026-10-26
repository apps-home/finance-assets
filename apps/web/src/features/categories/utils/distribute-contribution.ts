import { CategoryAllocation } from '@/features/categories/types/allocation'

export interface ContributionSplit {
  categoryId: string
  /** Quanto aportar na categoria, em R$ */
  amount: number
  /** Percentual da categoria na carteira depois do aporte */
  resultingPercentage: number
}

/**
 * Divide um aporte (em R$) entre as categorias com meta, sem vender nada:
 * primeiro cobre o que falta para cada categoria chegar à meta no patrimônio
 * pós-aporte; se o aporte não cobre tudo, divide na proporção do que falta.
 * O que sobrar depois de todas na meta segue a proporção das metas.
 */
export function distributeContribution(
  allocations: CategoryAllocation[],
  amount: number
): ContributionSplit[] {
  const targeted = allocations.filter(
    (item) => item.targetPercentage != null && item.targetPercentage > 0
  )

  if (amount <= 0 || targeted.length === 0) {
    return []
  }

  const newTotal =
    allocations.reduce((sum, item) => sum + item.balanceInBRL, 0) + amount

  const deficits = targeted.map((item) =>
    Math.max(
      0,
      ((item.targetPercentage as number) / 100) * newTotal - item.balanceInBRL
    )
  )
  const totalDeficit = deficits.reduce((sum, value) => sum + value, 0)
  // A sobra não vai para quem já está acima da meta (quando há outras abaixo)
  const eligible = targeted.map(
    (_, index) => totalDeficit <= 0 || deficits[index] > 0
  )
  const totalTarget = targeted.reduce(
    (sum, item, index) =>
      eligible[index] ? sum + (item.targetPercentage as number) : sum,
    0
  )

  const raw = targeted.map((item, index) => {
    const byTarget = eligible[index]
      ? (item.targetPercentage as number) / totalTarget
      : 0

    if (totalDeficit <= 0) return amount * byTarget
    if (totalDeficit >= amount) return amount * (deficits[index] / totalDeficit)

    return deficits[index] + (amount - totalDeficit) * byTarget
  })

  const rounded = raw.map((value) => Math.round(value * 100) / 100)

  // Joga a diferença de arredondamento na maior parcela para fechar o total
  const residue =
    Math.round(
      (amount - rounded.reduce((sum, value) => sum + value, 0)) * 100
    ) / 100
  if (residue !== 0) {
    const largest = rounded.indexOf(Math.max(...rounded))
    rounded[largest] = Math.round((rounded[largest] + residue) * 100) / 100
  }

  return targeted
    .map((item, index) => ({
      categoryId: item.categoryId,
      amount: rounded[index],
      resultingPercentage:
        ((item.balanceInBRL + rounded[index]) / newTotal) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
}
