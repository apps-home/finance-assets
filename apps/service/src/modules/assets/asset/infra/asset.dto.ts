import { PartialType } from '@nestjs/mapped-types'
import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString
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

  @IsString({ message: 'O ticker deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  ticker: string

  @IsOptional()
  @IsNumber({}, { message: 'A quantidade deve ser um número válido' })
  @Type(() => Number)
  quantity?: number

  @IsOptional()
  @IsNumber({}, { message: 'O preço médio deve ser um número válido' })
  @Type(() => Number)
  averagePrice?: number

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
