import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import PortfolioClient from './PortfolioClient'

async function PortfolioContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <PortfolioClient />
}

export default function PortfolioPage() {
  return (
    <Suspense>
      <PortfolioContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Carteira',
  description:
    'Visão consolidada da sua carteira pessoal: alocação, corretoras, rentabilidade e maiores variações'
}
