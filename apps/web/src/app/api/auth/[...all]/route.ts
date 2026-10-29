import { createAuthRouteHandler } from '@lib/auth/next'

import { auth } from '@/shared/lib/auth'

export const { GET, POST } = createAuthRouteHandler(auth)
