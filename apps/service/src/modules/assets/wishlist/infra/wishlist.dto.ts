import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator'

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
  ticker?: string

  @IsOptional()
  @IsString()
  name?: string
}
