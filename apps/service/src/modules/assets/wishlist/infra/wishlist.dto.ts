import { Transform } from 'class-transformer'
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator'

import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export class CreateWishlistDTO {
  @IsNotEmpty({ message: 'Category ID is required' })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId: string

  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string

  @IsNotEmpty({ message: 'Ticker is required' })
  @IsString({ message: 'Ticker must be a string' })
  ticker: string

  @IsOptional()
  @IsNumber({}, { message: 'Target price must be a number' })
  targetPrice?: number

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string
}

export class UpdateWishlistDTO {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string

  @IsOptional()
  @IsString({ message: 'Ticker must be a string' })
  ticker?: string

  @IsOptional()
  @IsNumber({}, { message: 'Target price must be a number' })
  targetPrice?: number

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string
}

export class FindAllWishlistParamsDTO {
  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  categoryId?: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim() || undefined
    }
    return undefined
  })
  search?: string

  @IsOptional()
  @IsIn(Object.values(CategoryType), { message: 'Invalid category type' })
  type?: CategoryType

  @IsOptional()
  @IsIn(['BELOW_OR_AT_TARGET', 'ABOVE_TARGET', 'NO_TARGET'], {
    message: 'Invalid target status'
  })
  targetStatus?: 'BELOW_OR_AT_TARGET' | 'ABOVE_TARGET' | 'NO_TARGET'

  @IsOptional()
  @IsIn(['monthChange'], { message: 'Invalid sort' })
  sort?: 'monthChange'

  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'Invalid order' })
  order?: 'asc' | 'desc'
}
