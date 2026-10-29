import 'server-only'

import { createSessionHelpers } from '@lib/auth/next'

import { auth } from './auth'

export const { getCurrentSession, getCurrentUser } = createSessionHelpers(auth)
