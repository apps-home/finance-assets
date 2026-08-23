'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { Toaster } from '@/shared/components/ui/sonner'
import { QueryClientProvider } from '@/shared/providers/query-client'
import { ThemeProvider } from '@/shared/providers/theme-provider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  )
}
