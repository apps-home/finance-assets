import type { Metadata } from 'next'

import Header from '@/shared/components/Header'

export const metadata: Metadata = {
  title: 'Finance Assets',
  description: 'Finance Assets'
}

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="grid h-svh grid-rows-[auto_1fr]">
      <Header />
      {children}
    </div>
  )
}
