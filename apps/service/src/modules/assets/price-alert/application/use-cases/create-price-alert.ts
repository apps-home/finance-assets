import { Injectable } from '@nestjs/common'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { Either, left, right } from '@/core/utils/Either'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'
import { AssetRepository } from '@/modules/assets/asset/domain/asset.repository'
import { WishlistNotFoundError } from '@/modules/assets/wishlist/application/errors/wishlist-not-found.error'
import { WishlistRepository } from '@/modules/assets/wishlist/domain/wishlist.repository'

import { PriceAlert } from '../../domain/price-alert.entity'
import { PriceAlertRepository } from '../../domain/price-alert.repository'

export interface CreatePriceAlertPayload {
  /** Origem: informe o ativo **ou** o item da wishlist */
  assetId?: string
  wishlistId?: string
  targetPrice: number
}

type CreatePriceAlertResponse = Either<
  AssetNotFoundError | WishlistNotFoundError | PayloadError,
  void
>

/**
 * Cria o alerta num ativo ou item da wishlist do usuário. Ele vigia o ticker
 * do catálogo da origem, na direção dada pela cotação atual.
 */
@Injectable()
export class CreatePriceAlertUseCase {
  constructor(
    private readonly priceAlertRepository: PriceAlertRepository,
    private readonly assetRepository: AssetRepository,
    private readonly wishlistRepository: WishlistRepository
  ) {}

  async execute(
    userId: string,
    { assetId, wishlistId, targetPrice }: CreatePriceAlertPayload
  ): Promise<CreatePriceAlertResponse> {
    if (!assetId === !wishlistId) {
      return left(new PayloadError('Inform either an asset or a wishlist item'))
    }

    const source = assetId
      ? await this.assetRepository.findById(assetId, userId)
      : await this.wishlistRepository.findById(wishlistId as string, userId)

    if (!source) {
      return left(
        assetId ? new AssetNotFoundError() : new WishlistNotFoundError()
      )
    }

    if (!source.marketAssetId) {
      return left(
        new PayloadError(
          'Only assets with a market quote can have price alerts'
        )
      )
    }

    try {
      const alert = PriceAlert.create({
        userId,
        marketAssetId: source.marketAssetId,
        assetId: assetId ?? null,
        wishlistId: wishlistId ?? null,
        targetPrice,
        currentPrice: source.currentClosePrice
      })

      await this.priceAlertRepository.create(alert)

      return right(void 0)
    } catch (error) {
      if (error instanceof PayloadError) {
        return left(error)
      }

      throw error
    }
  }
}
