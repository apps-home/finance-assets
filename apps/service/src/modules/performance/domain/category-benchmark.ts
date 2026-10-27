import { BenchmarkType } from '@/core/http/external/benchmark/benchmark-data.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

/** Benchmark natural de cada tipo de categoria, usado na rentabilidade por categoria */
export const CATEGORY_BENCHMARK: Record<CategoryType, BenchmarkType> = {
  [CategoryType.VARIABLE_BR]: BenchmarkType.IBOV,
  [CategoryType.FII]: BenchmarkType.IFIX,
  [CategoryType.VARIABLE_US]: BenchmarkType.SP500_BRL,
  [CategoryType.CRYPTO]: BenchmarkType.BTC_BRL,
  [CategoryType.FIXED]: BenchmarkType.CDI
}
