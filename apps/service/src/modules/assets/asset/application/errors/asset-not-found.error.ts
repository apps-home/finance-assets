export class AssetNotFoundError extends Error {
  constructor(message?: string) {
    super(message || 'Asset not found')
    this.name = AssetNotFoundError.name
  }
}
