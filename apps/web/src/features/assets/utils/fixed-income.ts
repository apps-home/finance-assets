import type { FixedIncomeIndexer } from '@/features/assets/api/types'

export const INDEXER_OPTIONS: Array<{
  value: FixedIncomeIndexer
  label: string
  rateLabel: string
  ratePlaceholder: string
  /** CDI e IPCA só existem em reais */
  brlOnly: boolean
}> = [
  {
    value: 'CDI',
    label: '% do CDI',
    rateLabel: '% do CDI',
    ratePlaceholder: 'Ex: 110',
    brlOnly: true
  },
  {
    value: 'IPCA',
    label: 'IPCA + taxa',
    rateLabel: 'Taxa real (% a.a.)',
    ratePlaceholder: 'Ex: 6,5',
    brlOnly: true
  },
  {
    value: 'PRE',
    label: 'Prefixado',
    rateLabel: 'Taxa (% a.a.)',
    ratePlaceholder: 'Ex: 12,5',
    brlOnly: false
  }
]

function formatRate(rate: number): string {
  return rate.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** "110% do CDI", "IPCA + 6,5%" ou "Pré 12,5% a.a." */
export function formatIndexer(
  indexer: FixedIncomeIndexer | null,
  rate: number | null
): string | null {
  if (!indexer || rate == null) return null

  switch (indexer) {
    case 'CDI':
      return `${formatRate(rate)}% do CDI`
    case 'IPCA':
      return `IPCA + ${formatRate(rate)}%`
    case 'PRE':
      return `Pré ${formatRate(rate)}% a.a.`
  }
}
