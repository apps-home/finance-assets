'use client'

import { Button } from '@lib/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

import type { MonthlyFinancialData } from '@/features/dashboard/api/types'
import { useGenerateInsights } from '@/features/dashboard/hooks/use-insights'

type InsightsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; content: string }
  | { status: 'error'; message: string }

interface InsightsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'month' | 'year'
  financialData: MonthlyFinancialData
  yearlyData?: Record<string, string | number>[]
  selectedYear?: string
}

export function InsightsDialog({
  open,
  onOpenChange,
  mode,
  financialData,
  yearlyData,
  selectedYear
}: InsightsDialogProps) {
  const {
    mutate: generate,
    reset,
    data: content,
    isIdle,
    isPending,
    isError
  } = useGenerateInsights()

  const fetchInsights = useCallback(() => {
    generate(
      mode === 'year' && yearlyData
        ? {
            mode: 'year',
            year: selectedYear,
            monthlyBreakdown: yearlyData,
            summary: financialData
          }
        : { mode: 'month', ...financialData }
    )
  }, [generate, financialData, mode, yearlyData, selectedYear])

  const state: InsightsState = isPending
    ? { status: 'loading' }
    : isError
      ? {
          status: 'error',
          message: 'Não foi possível gerar os insights. Tente novamente.'
        }
      : content !== undefined
        ? { status: 'success', content }
        : { status: 'idle' }

  useEffect(() => {
    if (open && isIdle) {
      fetchInsights()
    }
  }, [open, isIdle, fetchInsights])

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80dvh] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-yellow-500" />
            Insights Financeiros
          </DialogTitle>
          <DialogDescription>
            {mode === 'year' ? (
              <>
                Análise inteligente do seu patrimônio ao longo de{' '}
                <strong className="text-foreground">{selectedYear}</strong>
              </>
            ) : (
              <>
                Análise inteligente do seu patrimônio referente a{' '}
                <strong className="text-foreground">
                  {financialData.referenceMonth}
                </strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          {state.status === 'loading' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="rounded-full bg-primary/10 p-4">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
              <p className="text-muted-foreground text-sm">
                Gerando insights com IA...
              </p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="rounded-full bg-destructive/10 p-4">
                <Sparkles className="size-6 text-destructive" />
              </div>
              <p className="text-center text-muted-foreground text-sm">
                {state.message}
              </p>
              <Button variant="outline" size="sm" onClick={fetchInsights}>
                <RefreshCw className="size-3.5" />
                Tentar novamente
              </Button>
            </div>
          )}

          {state.status === 'success' && (
            <div className="max-w-none space-y-3 break-words">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h3 className="mt-5 mb-2 font-bold text-foreground text-xl">
                      {children}
                    </h3>
                  ),
                  h2: ({ children }) => (
                    <h4 className="mt-5 mb-1.5 font-semibold text-foreground text-lg">
                      {children}
                    </h4>
                  ),
                  h3: ({ children }) => (
                    <h5 className="mt-4 mb-1 font-semibold text-base text-foreground">
                      {children}
                    </h5>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground text-sm/relaxed">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-medium text-foreground">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="mt-1 space-y-1 pl-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mt-1 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-primary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-muted-foreground text-sm/relaxed">
                      {children}
                    </li>
                  ),
                  hr: () => <hr className="my-4 border-border" />
                }}
              >
                {state.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {state.status === 'success' && (
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={fetchInsights}>
              <RefreshCw className="size-3.5" />
              Gerar novamente
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
