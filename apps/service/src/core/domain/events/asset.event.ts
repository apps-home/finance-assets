import { CategoryType } from '@/modules/assets/categories/domain/category.entity'

export enum AssetEvent {
  CREATED = 'asset.created',
  UPDATED = 'asset.updated',
  DELETED = 'asset.deleted'
}

export class AssetEventPayload {
  constructor(
    public readonly assetId: string,
    public readonly ticker: string,
    public readonly categoryType: CategoryType
  ) {}
}
