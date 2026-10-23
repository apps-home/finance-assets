import { CreateAssetPayload } from './create-asset.dto'

export type UpdateAssetPayload = Partial<Omit<CreateAssetPayload, 'categoryId'>>
