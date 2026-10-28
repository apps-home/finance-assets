'use client'

import { Toaster } from '@lib/ui/components/sonner'
import { TooltipProvider } from '@lib/ui/components/tooltip'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

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
        <NuqsAdapter>
          <TooltipProvider>{children}</TooltipProvider>
        </NuqsAdapter>
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  )
}
