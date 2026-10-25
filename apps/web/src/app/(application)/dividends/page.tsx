import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import DividendsClient from './DividendsClient'

async function DividendsContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <DividendsClient />
}

export default function DividendsPage() {
  return (
    <Suspense>
      <DividendsContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Proventos',
  description:
    'Acompanhe dividendos, JCP e rendimentos recebidos por mês, ano e classe de ativo'
}
