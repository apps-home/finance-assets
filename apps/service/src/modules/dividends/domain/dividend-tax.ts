import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

// Retenção na fonte dos EUA sobre dividendos de não residentes
const DEFAULT_TAX_RATE_BY_CATEGORY: Partial<Record<CategoryType, number>> = {
  [CategoryType.VARIABLE_US]: 0.3
}

/**
 * Imposto retido presumido quando o usuário não informa um: só existe para
 * categorias com retenção padrão (ações US) e é 30% do bruto.
 */
export function defaultTaxAmount(
  categoryType: CategoryType,
  amount: number
): number | null {
  const rate = DEFAULT_TAX_RATE_BY_CATEGORY[categoryType]

  if (!rate) return null

  const tax = Math.round(amount * rate * 100) / 100

  return tax > 0 && tax < amount ? tax : null
}
