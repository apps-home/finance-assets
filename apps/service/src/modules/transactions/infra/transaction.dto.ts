import { OmitType, PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import {
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf
} from 'class-validator'

import { TransactionType } from '../domain/transaction.entity'

export class CreateTransactionDTO {
  @IsNotEmpty({ message: 'Asset ID is required' })
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId: string

  @IsIn(Object.values(TransactionType), { message: 'Invalid operation type' })
  type: TransactionType

  @IsNotEmpty({ message: 'Date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Date must be a valid date' })
  date: Date

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsNumber({ maxDecimalPlaces: 8 }, { message: 'Quantity must be a number' })
  @IsPositive({ message: 'Quantity must be greater than zero' })
  quantity?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price?: number | null

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Fees must be a number' })
  @Min(0, { message: 'Fees cannot be negative' })
  fees?: number

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'Factor must be a number' })
  @IsPositive({ message: 'Factor must be greater than zero' })
  factor?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsNumber(
    { maxDecimalPlaces: 6 },
    { message: 'Exchange rate must be a number' }
  )
  @IsPositive({ message: 'Exchange rate must be greater than zero' })
  exchangeRate?: number | null

  @IsOptional()
  @ValidateIf((_, val) => val !== null)
  @IsString({ message: 'Notes must be a text' })
  @MaxLength(500, { message: 'Notes must have at most 500 characters' })
  notes?: string | null
}

export class UpdateTransactionDTO extends PartialType(
  OmitType(CreateTransactionDTO, ['assetId'] as const)
) {}

export class FindAllTransactionsParamsDTO {
  @IsOptional()
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId?: string

  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'From must be a valid date' })
  from?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'To must be a valid date' })
  to?: Date
}

export class MonthlyContributionsParamsDTO {
  @Type(() => Number)
  @IsInt({ message: 'Year must be an integer' })
  @Min(2000)
  @Max(2100)
  year: number

  @Type(() => Number)
  @IsInt({ message: 'Month must be an integer' })
  @Min(1)
  @Max(12)
  month: number
}
