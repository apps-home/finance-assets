import { Injectable } from '@nestjs/common'

import { Either, right } from '@/core/utils/Either'

import { FindAllPatrimonyItemsParams } from '../../domain/dto/find-all-patrimony-items-params.dto'
import {
  PatrimonyItemHTTP,
  PatrimonyItemMapper
} from '../../domain/patrimony-item.mapper'
import { PatrimonyItemRepository } from '../../domain/patrimony-item.repository'

export interface PatrimonySummary {
  totalPhysicalAssets: number
  totalLiabilities: number
  netPhysicalBalance: number
}

export interface FindAllPatrimonyItemsResult {
  items: PatrimonyItemHTTP[]
  summary: PatrimonySummary
}

type FindAllPatrimonyItemsResponse = Either<Error, FindAllPatrimonyItemsResult>

const round = (value: number) => Math.round(value * 100) / 100

@Injectable()
export class FindAllPatrimonyItemsUseCase {
  constructor(private patrimonyItemRepository: PatrimonyItemRepository) {}

  async execute(
    params: FindAllPatrimonyItemsParams
  ): Promise<FindAllPatrimonyItemsResponse> {
    const items = await this.patrimonyItemRepository.list(params)

    let totalPhysicalAssets = 0
    let totalLiabilities = 0

    for (const item of items) {
      if (!item.isActive) continue
      if (item.isLiability) {
        totalLiabilities += item.currentValue
      } else {
        totalPhysicalAssets += item.currentValue
      }
    }

    totalPhysicalAssets = round(totalPhysicalAssets)
    totalLiabilities = round(totalLiabilities)

    return right({
      items: items.map(PatrimonyItemMapper.toHTTP),
      summary: {
        totalPhysicalAssets,
        totalLiabilities,
        netPhysicalBalance: round(totalPhysicalAssets - totalLiabilities)
      }
    })
  }
}
