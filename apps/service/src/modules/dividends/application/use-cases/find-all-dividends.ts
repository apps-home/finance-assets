import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import {
  DividendMapper,
  DividendWithAssetHTTPResponse
} from '../../domain/dividend.mapper'
import { DividendRepository } from '../../domain/dividend.repository'
import { FindAllDividendsParams } from '../../domain/dto/find-all-dividends-params.dto'

type FindAllDividendsResponse = Either<Error, DividendWithAssetHTTPResponse[]>

@Injectable()
export class FindAllDividendsUseCase {
  constructor(private readonly dividendRepository: DividendRepository) {}

  async execute(
    params: FindAllDividendsParams
  ): Promise<FindAllDividendsResponse> {
    const items = await this.dividendRepository.list(params)

    return right(items.map(DividendMapper.toHTTPWithAsset))
  }
}
