import { CreatePatrimonyItemPayload } from './create-patrimony-item.dto'

export type UpdatePatrimonyItemPayload = Partial<
  Omit<CreatePatrimonyItemPayload, 'userId'>
>
