import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf
} from 'class-validator'

import { PatrimonyItemType } from '../domain/patrimony-item.entity'

/** "AAAA-MM-DD" vira 00:00 UTC; qualquer outro texto falha no @IsDate */
function toCalendarDate(value: unknown): unknown {
  if (value === null || value === '') return null
  if (typeof value !== 'string') return value

  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : value
}

export class CreatePatrimonyItemDTO {
  @IsString({ message: 'O nome deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  name: string

  @IsEnum(PatrimonyItemType, { message: 'Tipo de item patrimonial inválido' })
  type: PatrimonyItemType

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'O valor atual deve ser um número válido' }
  )
  @Min(0, { message: 'O valor atual não pode ser negativo' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return value
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  currentValue: number

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'O valor de aquisição deve ser um número válido' }
  )
  @Min(0, { message: 'O valor de aquisição não pode ser negativo' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return Number.isNaN(num) ? value : num
  })
  purchaseValue?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsDate({ message: 'A data de aquisição deve estar no formato AAAA-MM-DD' })
  @Transform(({ value }) => toCalendarDate(value))
  acquiredAt?: Date | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined)
  @IsString({ message: 'As observações devem ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }
    return null
  })
  notes?: string | null

  @IsOptional()
  @IsBoolean({ message: 'O status ativo deve ser verdadeiro ou falso' })
  isActive?: boolean
}

export class UpdatePatrimonyItemDTO extends PartialType(
  CreatePatrimonyItemDTO
) {}

export class FindAllPatrimonyItemsParamsDTO {
  @IsOptional()
  @IsEnum(PatrimonyItemType, { message: 'Tipo de item patrimonial inválido' })
  type?: PatrimonyItemType

  @IsOptional()
  @IsBoolean({ message: 'O filtro de status ativo deve ser booleano' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true
    if (value === 'false' || value === false) return false
    return undefined
  })
  isActive?: boolean
}
