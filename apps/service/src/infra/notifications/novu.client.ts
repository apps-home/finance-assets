import { Novu } from '@novu/api'

import { EnvService } from '../env/env.service'

/** Token do client do Novu; `null` quando as notificações estão desligadas */
export const NOVU_CLIENT = Symbol('NOVU_CLIENT')

export function createNovuClient(env: EnvService): Novu | null {
  const secretKey = env.get('NOVU_SECRET_KEY')

  if (!secretKey) return null

  const serverURL = env.get('NOVU_API_URL')

  return new Novu({ secretKey, ...(serverURL && { serverURL }) })
}
