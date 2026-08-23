'use client'

import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { Button } from '@/shared/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log do erro para serviço de monitoramento (ex: Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <h1 className="mb-2 font-bold text-8xl text-destructive">500</h1>

        <h2 className="mb-4 font-semibold text-2xl text-foreground">
          Algo deu errado
        </h2>

        <p className="mx-auto mb-8 max-w-md text-muted-foreground">
          Desculpe, ocorreu um erro inesperado. Nossa equipe foi notificada e
          está trabalhando para resolver o problema.
        </p>

        {error.digest && (
          <p className="mb-8 font-mono text-muted-foreground text-xs">
            ID do erro: {error.digest}
          </p>
        )}

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
          <Button variant="link" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
