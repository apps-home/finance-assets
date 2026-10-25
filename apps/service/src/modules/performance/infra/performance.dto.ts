import { Expose } from 'class-transformer'
import { IsIn, IsOptional, Matches } from 'class-validator'

import {
  PERFORMANCE_SCOPES,
  type PerformanceScope
} from '../domain/performance-scope'

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

  @Expose()
  @IsOptional()
  @IsIn(PERFORMANCE_SCOPES, {
    message: 'O escopo deve ser all, variable ou fixed'
  })
  scope?: PerformanceScope
}
