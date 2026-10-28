export enum MarketAssetEvent {
  QUOTE_UPDATED = 'market-asset.quote-updated'
}

export class MarketAssetQuoteUpdatedPayload {
  constructor(
    public readonly marketAssetId: string,
    /** Cotação nova, na moeda do ativo */
    public readonly price: number,
    public readonly updatedAt: Date
  ) {}
}
