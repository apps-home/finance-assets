import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf
} from 'class-validator'

import {
  PRICE_HISTORY_RANGES,
  type PriceHistoryRange
} from '@/core/http/external/market-data/price-history.gateway'
import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { FixedIncomeIndexer } from '../domain/fixed-income-valuation'

export class CreateAssetDTO {
  @IsNotEmpty({ message: 'A categoria é obrigatória' })
  @IsUUID('4', { message: 'A categoria deve ser um UUID válido' })
  categoryId: string

  @IsString({ message: 'O nome deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  name: string

  @IsOptional()
  @IsString({ message: 'O ticker deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return value
  })
  ticker?: string

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  quantity?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber({}, { message: 'O preço médio deve ser um número válido' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  averagePrice?: number | null

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }
    return null
  })
  broker?: string | null

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser verdadeiro ou falso' })
  isActive?: boolean

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber({}, { message: 'O preço atual deve ser um número válido' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  currentClosePrice?: number | null

  /** Renda fixa: saldo calculado pelo indexador (null = saldo manual) */
  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsIn(Object.values(FixedIncomeIndexer), {
    message: 'O indexador deve ser CDI, IPCA ou PRE'
  })
  indexer?: FixedIncomeIndexer | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber({}, { message: 'A taxa deve ser um número válido' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  indexerRate?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsDate({ message: 'A data da aplicação deve estar no formato AAAA-MM-DD' })
  @Transform(({ value }) => toCalendarDate(value))
  investedAt?: Date | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsDate({ message: 'O vencimento deve estar no formato AAAA-MM-DD' })
  @Transform(({ value }) => toCalendarDate(value))
  maturityAt?: Date | null
}

/** "AAAA-MM-DD" vira 00:00 UTC; qualquer outro texto falha no @IsDate */
function toCalendarDate(value: unknown): unknown {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return value

  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : value
}

export class RefreshQuotesDTO {
  @IsUUID('4', { message: 'A categoria deve ser um UUID válido' })
  categoryId: string
}

export class UpdateAssetDTO extends PartialType(
  OmitType(CreateAssetDTO, ['categoryId'] as const)
) {}

export class FindAssetsParamsDTO {
  @IsOptional()
  @IsString({ message: 'A busca deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim() || undefined
    }
    return undefined
  })
  search?: string

  @IsOptional()
  @IsUUID('4', { message: 'A categoria deve ser um UUID válido' })
  categoryId?: string

  @IsOptional()
  @IsIn(Object.values(CategoryType), { message: 'Tipo de categoria inválido' })
  type?: CategoryType

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'Status inválido' })
  status?: 'ACTIVE' | 'INACTIVE'

  @IsOptional()
  @IsIn(['monthChange'], { message: 'Ordenação inválida' })
  sort?: 'monthChange'

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Direção da ordenação inválida' })
  order?: 'asc' | 'desc'
}

export class AssetPriceHistoryParamsDTO {
  @IsOptional()
  @IsIn(PRICE_HISTORY_RANGES, {
    message: `Range must be one of: ${PRICE_HISTORY_RANGES.join(', ')}`
  })
  range: PriceHistoryRange = '1m'
}
