import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'
import { CategoryType } from '../domain/category.entity'

export class CreateCategoryDTO {
  @IsString({ message: 'O nome deve ser um texto válido' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  name: string

  @IsString({ message: 'A moeda deve ser um texto válido' })
  @IsNotEmpty({ message: 'A moeda é obrigatória' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  currency: string

  @IsArray({ message: 'Os anos devem ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe pelo menos um ano' })
  @IsInt({ each: true, message: 'Cada ano deve ser um número inteiro' })
  years: number[]

  @IsOptional()
  @IsEnum(CategoryType, { message: 'Tipo de categoria inválido' })
  type?: CategoryType

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return null
    }
    return Number(value)
  })
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'A meta de alocação deve ser um número válido' }
  )
  @Min(0, { message: 'A meta de alocação não pode ser negativa' })
  @Max(100, { message: 'A meta de alocação não pode ser maior que 100' })
  targetPercentage?: number | null
}

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) {}

export class FindAllCategoriesParamsDTO {
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
  @IsString({ message: 'A moeda deve ser um texto válido' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return undefined
  })
  currency?: string

  @IsOptional()
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? undefined : parsed
  })
  year?: number

  @IsOptional()
  @IsEnum(CategoryType, { message: 'Tipo de categoria inválido' })
  type?: CategoryType
}
