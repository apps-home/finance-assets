import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import type { EnvService } from '../env/env.service'
import { NovuInboxService } from './novu-inbox.service'

function makeService(values: Record<string, string | undefined>) {
  const env = { get: (key: string) => values[key] } as unknown as EnvService
  return new NovuInboxService(env)
}

describe('NovuInboxService', () => {
  it('should be disabled without the secret key or the application identifier', () => {
    expect(
      makeService({ NOVU_APPLICATION_IDENTIFIER: 'app' }).getSession('user-1')
    ).toEqual({ enabled: false })
    expect(
      makeService({ NOVU_SECRET_KEY: 'secret' }).getSession('user-1')
    ).toEqual({ enabled: false })
  })

  it('should sign the subscriber id with the secret key', () => {
    const session = makeService({
      NOVU_SECRET_KEY: 'secret',
      NOVU_APPLICATION_IDENTIFIER: 'app',
      NOVU_API_URL: 'https://eu.api.novu.co'
    }).getSession('user-1')

    expect(session).toEqual({
      enabled: true,
      applicationIdentifier: 'app',
      subscriberId: 'user-1',
      subscriberHash: createHmac('sha256', 'secret')
        .update('user-1')
        .digest('hex'),
      apiUrl: 'https://eu.api.novu.co',
      socketUrl: null
    })
  })
})
