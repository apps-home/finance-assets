import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import WishlistClient from './WishlistClient'

async function WishlistContent() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return <WishlistClient />
}

export default function WishlistPage() {
  return (
    <Suspense>
      <WishlistContent />
    </Suspense>
  )
}

export const metadata: Metadata = {
  title: 'Finance Assets | Wishlist',
  description:
    'Acompanhe ativos de interesse, defina metas de compra e monitore cotações diárias'
}
