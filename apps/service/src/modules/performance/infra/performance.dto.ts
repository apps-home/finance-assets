import { Expose } from 'class-transformer'
import { IsOptional, Matches } from 'class-validator'

export class PerformanceParamsDTO {
  @Expose()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'O período inicial deve estar no formato AAAA-MM'
  })
  from?: string

  @Expose()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'O período final deve estar no formato AAAA-MM'
  })
  to?: string
}
