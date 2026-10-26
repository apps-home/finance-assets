import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Transform, Type } from 'class-transformer'
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  Min
} from 'class-validator'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

import { DividendType } from '../domain/dividend.entity'

export class CreateDividendDTO {
  @IsNotEmpty({ message: 'Asset ID is required' })
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId: string

  @IsOptional()
  @IsIn(Object.values(DividendType), { message: 'Invalid dividend type' })
  type?: DividendType

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than zero' })
  amount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Tax amount must be a number' })
  @Min(0, { message: 'Tax amount cannot be negative' })
  taxAmount?: number

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'Rate amount must be a number' }
  )
  @IsPositive({ message: 'Rate amount must be greater than zero' })
  rateAmount?: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 }, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be greater than zero' })
  quantity?: number

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'Exchange rate must be a number' }
  )
  @IsPositive({ message: 'Exchange rate must be greater than zero' })
  exchangeRate?: number

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'COM date must be a valid date' })
  comDate?: Date

  @IsNotEmpty({ message: 'Payment date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Payment date must be a valid date' })
  paymentDate: Date
}

export class UpdateDividendDTO extends PartialType(
  OmitType(CreateDividendDTO, ['assetId'] as const)
) {}

export class BackfillDividendsDTO {
  @IsOptional()
  @IsInt({ message: 'Months must be an integer' })
  @Min(1)
  @Max(24)
  months?: number
}

export class FindAllDividendsParamsDTO {
  @IsOptional()
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId?: string

  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string

  @IsOptional()
  @IsIn(Object.values(CategoryType), { message: 'Invalid category type' })
  categoryType?: CategoryType

  @IsOptional()
  @IsIn(Object.values(DividendType), { message: 'Invalid dividend type' })
  type?: DividendType

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000)
  @Max(2100)
  year?: number
}

export class DividendsSummaryParamsDTO {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000)
  @Max(2100)
  year?: number
}
