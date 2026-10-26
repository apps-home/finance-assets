export enum AssetEvent {
  CREATED = 'asset.created',
  UPDATED = 'asset.updated',
  DELETED = 'asset.deleted'
}

export class AssetEventPayload {
  constructor(
    public readonly assetId: string,
    /** Ativo do catálogo cuja cotação deve ser buscada */
    public readonly marketAssetId: string
  ) {}
}
