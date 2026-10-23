import { CreateCategoryPayload } from './create-category.dto'

export type UpdateCategoryPayload = Partial<
  Omit<CreateCategoryPayload, 'userId'>
>
