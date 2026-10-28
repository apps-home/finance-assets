import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator'

export class CreatePriceAlertDTO {
  @IsOptional()
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId?: string

  @IsOptional()
  @IsUUID('4', { message: 'Wishlist item ID must be a valid UUID' })
  wishlistId?: string

  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'Target price must be a number' }
  )
  @IsPositive({ message: 'Target price must be greater than zero' })
  targetPrice: number
}

export class ListPriceAlertsParamsDTO {
  @IsOptional()
  @IsUUID('4', { message: 'Asset ID must be a valid UUID' })
  assetId?: string

  @IsOptional()
  @IsUUID('4', { message: 'Wishlist item ID must be a valid UUID' })
  wishlistId?: string
}
