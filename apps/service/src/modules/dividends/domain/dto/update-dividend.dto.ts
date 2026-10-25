import { CreateDividendPayload } from './create-dividend.dto'

export type UpdateDividendPayload = Partial<
  Omit<CreateDividendPayload, 'userId' | 'assetId'>
>
