import { MarketAsset } from './market-asset.entity'

export abstract class MarketAssetRepository {
  abstract findById(id: string): Promise<MarketAsset | null>
  /**
   * Devolve o ativo do catálogo com o mesmo ticker + tipo, ou cria o recebido.
   * Atômico: dois cadastros simultâneos do mesmo ticker não duplicam a linha.
   */
  abstract findOrCreate(marketAsset: MarketAsset): Promise<MarketAsset>
  abstract save(marketAsset: MarketAsset): Promise<void>
  /**
   * Itens do catálogo ainda usados por algum ativo ativo, item da wishlist ou
   * alerta de preço
   */
  abstract findAllInUse(): Promise<MarketAsset[]>
}
