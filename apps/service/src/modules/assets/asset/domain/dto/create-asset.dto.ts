export class CreateAssetPayload {
  name: string
  ticker?: string
  quantity?: number | null
  averagePrice?: number | null
  broker?: string | null
  isActive?: boolean
  currentClosePrice?: number | null
  categoryId: string
}
