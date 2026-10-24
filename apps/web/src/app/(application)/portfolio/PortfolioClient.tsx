'use client'

import { Briefcase } from 'lucide-react'

import { PortfolioDashboard } from '@/features/assets/components/PortfolioDashboard'

export default function PortfolioClient() {
  return (
    <div className="bg-background px-4 pt-4 pb-12 sm:px-6">
      <div className="mx-auto max-w-screen-2xl space-y-6 sm:space-y-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-xl bg-primary/10 p-2.5 sm:p-3">
            <Briefcase className="size-6 text-primary sm:size-8" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
              Minha Carteira
            </h1>
            <p className="text-muted-foreground">
              Seus ativos pessoais, separados do patrimônio da família
            </p>
          </div>
        </div>

        <PortfolioDashboard />
      </div>
    </div>
  )
}
