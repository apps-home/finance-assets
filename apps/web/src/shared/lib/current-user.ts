import 'server-only'

import { headers } from 'next/headers'

import { getSession } from './auth'

export async function getCurrentSession() {
  const session = await getSession({
    headers: await headers()
  })
  return session
}

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user
}
