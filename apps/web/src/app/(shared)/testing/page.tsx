import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentSession } from '@/shared/lib/current-user'

import TestingClient from './TestingClient'

async function TestingContent() {
  const session = await getCurrentSession()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <main>
      <TestingClient />
    </main>
  )
}

export default function TestingPage() {
  return (
    <Suspense>
      <TestingContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Testing',
  description: 'Testing page'
}
