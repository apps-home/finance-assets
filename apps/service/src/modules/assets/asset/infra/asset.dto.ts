import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf
} from 'class-validator'

export class CreateAssetDTO {
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
}

export class UpdateAssetDTO extends PartialType(CreateAssetDTO) {}

export class FindAllAssetsParamsDTO {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  name?: string

  @IsOptional()
  @IsString({ message: 'A corretora deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  broker?: string

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean({ message: 'O status ativo deve ser verdadeiro ou falso' })
  isActive?: boolean
}
