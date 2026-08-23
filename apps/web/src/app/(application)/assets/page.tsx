import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import AssetsClient from './AssetsClient'

async function AssetsContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <AssetsClient />
}

export default function AssetsPage() {
  return (
    <Suspense>
      <AssetsContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Ativos',
  description:
    'Gerencie e acompanhe todos os ativos da sua carteira de investimentos'
}
