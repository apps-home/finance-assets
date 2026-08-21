import { PartialType } from '@nestjs/mapped-types'
import { Expose, Transform } from 'class-transformer'
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator'

export class CreateBudgetDTO {
  @Expose()
  @IsString({ message: 'O ID da categoria é inválido' })
  @IsNotEmpty({ message: 'O ID da categoria é obrigatório' })
  categoryId: string

  @Expose()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'O mês deve ser um número inteiro' })
  @Min(1, { message: 'O mês não pode ser menor que 1' })
  @Max(12, { message: 'O mês não pode ser maior que 12' })
  month: number

  @Expose()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Min(2024, { message: 'O ano deve ser 2024 ou superior' })
  year: number

  @Expose()
  @Transform(({ value }) => Number(value))
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
      maxDecimalPlaces: 6
    },
    { message: 'O valor deve ser um número válido' }
  )
  @Min(0, { message: 'O valor não pode ser negativo' })
  amount: number

  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return null
    }

    return Number(value)
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
      maxDecimalPlaces: 6
    },
    { message: 'A taxa de câmbio deve ser um número válido' }
  )
  @Min(0, { message: 'A taxa de câmbio não pode ser negativa' })
  exchangeRate?: number | null

  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return null
    }
    return Number(value)
  })
  @IsNumber(
    {
      allowNaN: false,
      allowInfinity: false,
      maxDecimalPlaces: 2
    },
    { message: 'O valor de dividendos deve ser um número válido' }
  )
  @Min(0, { message: 'O valor de dividendos não pode ser negativo' })
  dividendAmount?: number | null
}

export class UpdateBudgetDTO extends PartialType(CreateBudgetDTO) {}

export class FindAllBudgetsParamsDTO {
  @Expose()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim()
    }

    return undefined
  })
  @IsString({ message: 'O ID da categoria é inválido' })
  categoryId?: string

  @Expose()
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined
  )
  @IsInt({ message: 'O mês deve ser um número inteiro' })
  @Min(1, { message: 'O mês não pode ser menor que 1' })
  @Max(12, { message: 'O mês não pode ser maior que 12' })
  month?: number

  @Expose()
  @IsOptional()
  @Transform(({ value }) =>
    value !== undefined && value !== '' ? Number(value) : undefined
  )
  @IsInt({ message: 'O ano deve ser um número inteiro' })
  @Min(2024, { message: 'O ano deve ser 2024 ou superior' })
  year?: number
}
