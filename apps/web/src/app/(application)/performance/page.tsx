import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import PerformanceClient from './PerformanceClient'

async function PerformanceContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <PerformanceClient />
}

export default function PerformancePage() {
  return (
    <Suspense>
      <PerformanceContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Rentabilidade',
  description:
    'Compare a rentabilidade da sua carteira com CDI, Ibovespa e S&P 500 em reais'
}
