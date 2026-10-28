'use client'

import { Button } from '@lib/ui/components/button'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import {
  CalendarDays,
  Coins,
  DownloadCloud,
  PlusIcon,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useAssets } from '@/features/assets/hooks/use-assets'
import { useAvailableYears } from '@/features/categories/hooks/use-competence'
import { StatCard } from '@/features/dashboard/components/StatCard'
import type {
  CreateDividendDTO,
  DividendWithAsset
} from '@/features/dividends/api/types'
import { BackfillDividendsDialog } from '@/features/dividends/components/BackfillDividendsDialog'
import { DividendFormDialog } from '@/features/dividends/components/DividendFormDialog'
import { DividendsBreakdown } from '@/features/dividends/components/DividendsBreakdown'
import { DividendsChart } from '@/features/dividends/components/DividendsChart'
import { DividendTable } from '@/features/dividends/components/DividendTable'
import { UpcomingDividends } from '@/features/dividends/components/UpcomingDividends'
import {
  useBackfillDividends,
  useCreateDividend,
  useDeleteDividend,
  useDividends,
  useDividendsSummary,
  useUpcomingDividends,
  useUpdateDividend
} from '@/features/dividends/hooks/use-dividends'
import { ConfirmDeleteDialog } from '@/shared/components/ConfirmDeleteDialog'
import { formatCurrency } from '@/shared/utils/format-currency'
import { MONTH_NAMES } from '@/shared/utils/month-names'

export default function DividendsClient() {
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [formOpen, setFormOpen] = useState(false)
  const [backfillOpen, setBackfillOpen] = useState(false)
  const [editingDividend, setEditingDividend] =
    useState<DividendWithAsset | null>(null)
  const [deletingDividend, setDeletingDividend] =
    useState<DividendWithAsset | null>(null)

  const year = Number.parseInt(selectedYear, 10)

  const { data: availableYears = [] } = useAvailableYears()
  const years = useMemo(
    () => [...new Set([...availableYears, currentYear])].sort((a, b) => b - a),
    [availableYears, currentYear]
  )

  const { data: summary, isLoading: isLoadingSummary } =
    useDividendsSummary(year)
  const { data: dividends = [], isLoading: isLoadingDividends } = useDividends({
    year
  })
  const { data: upcoming = [] } = useUpcomingDividends()
  const { data: assets = [] } = useAssets({ status: 'ACTIVE' })

  const { mutateAsync: createDividend, isPending: isCreating } =
    useCreateDividend()
  const { mutateAsync: updateDividend, isPending: isUpdating } =
    useUpdateDividend()
  const { mutateAsync: deleteDividend, isPending: isDeleting } =
    useDeleteDividend()
  const { mutateAsync: backfillDividends, isPending: isBackfilling } =
    useBackfillDividends()

  async function handleConfirmBackfill() {
    await backfillDividends(12)
    setBackfillOpen(false)
  }

  function handleOpenCreate() {
    setEditingDividend(null)
    setFormOpen(true)
  }

  function handleEdit(item: DividendWithAsset) {
    setEditingDividend(item)
    setFormOpen(true)
  }

  async function handleSubmitForm(dto: CreateDividendDTO) {
    if (editingDividend) {
      const { assetId: _assetId, ...fields } = dto
      await updateDividend({ id: editingDividend.dividend.id, dto: fields })
      setEditingDividend(null)
    } else {
      await createDividend(dto)
    }

    setFormOpen(false)
  }

  async function handleConfirmDelete() {
    if (!deletingDividend) return

    await deleteDividend(deletingDividend.dividend.id)
    setDeletingDividend(null)
  }

  const currentMonthName = MONTH_NAMES[new Date().getMonth()]

  if (isLoadingSummary && !summary) {
    return (
      <div className="bg-background px-4 pt-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-screen-2xl space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div
      data-slot="dividends-page"
      className="bg-background px-4 pt-4 pb-12 sm:px-6"
    >
      <div className="mx-auto max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Coins className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-2xl text-foreground sm:text-3xl">
                Proventos
              </h1>
              <p className="text-muted-foreground text-xs">
                Dividendos, JCP e rendimentos recebidos por mês, ano e classe de
                ativo
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-4 self-start md:self-auto">
            <div className="min-w-0">
              <Tabs value={selectedYear} onValueChange={setSelectedYear}>
                <TabsList variant="line" className="gap-5">
                  {years.map((item) => (
                    <TabsTrigger
                      key={item}
                      value={String(item)}
                      className="cursor-pointer font-semibold text-sm"
                    >
                      {item}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Button
              variant="outline"
              onClick={() => setBackfillOpen(true)}
              disabled={assets.length === 0}
              className="gap-2"
            >
              <DownloadCloud className="size-4" />
              Importar 12 meses
            </Button>
            <Button
              onClick={handleOpenCreate}
              disabled={assets.length === 0}
              className="gap-2"
            >
              <PlusIcon className="size-4" />
              Novo Provento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title={`Recebido em ${currentMonthName}`}
            value={summary?.totalCurrentMonth ?? 0}
            icon={Wallet}
            subtitle="Mês atual"
          />
          <StatCard
            title={`Recebido em ${year}`}
            value={summary?.totalYear ?? 0}
            icon={TrendingUp}
            subtitle={`${dividends.length} lançamentos`}
          />
          <StatCard
            title="Média mensal"
            value={summary?.monthlyAverage ?? 0}
            icon={CalendarDays}
            subtitle={
              year === currentYear
                ? `Média dos ${new Date().getMonth() + 1} primeiros meses`
                : 'Média dos 12 meses'
            }
          />
        </div>

        {summary && (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <DividendsChart summary={summary} />
              </div>
              <UpcomingDividends items={upcoming} />
            </div>

            <DividendsBreakdown summary={summary} />
          </>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold text-sm">
            Lançamentos de {year}
            <span className="ml-2 font-normal text-muted-foreground">
              {formatCurrency(summary?.totalYear ?? 0)} recebidos
            </span>
          </h2>

          {isLoadingDividends && dividends.length === 0 ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : dividends.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-border border-dashed py-16 text-center">
              <div className="mb-4 rounded-xl bg-muted/50 p-4">
                <Coins className="size-10 text-muted-foreground/60" />
              </div>
              <p className="font-medium text-sm">Nenhum provento em {year}</p>
              <p className="mt-1 max-w-sm text-muted-foreground text-xs">
                Registre manualmente ou aguarde a sincronização automática de
                segunda-feira para ativos com ticker.
              </p>
            </div>
          ) : (
            <DividendTable
              items={dividends}
              onEdit={handleEdit}
              onDelete={setDeletingDividend}
            />
          )}
        </div>
      </div>

      <DividendFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingDividend(null)
        }}
        onSubmit={handleSubmitForm}
        isPending={isCreating || isUpdating}
        assets={assets}
        editing={editingDividend}
      />

      <BackfillDividendsDialog
        open={backfillOpen}
        onOpenChange={setBackfillOpen}
        onConfirm={handleConfirmBackfill}
        isPending={isBackfilling}
      />

      <ConfirmDeleteDialog
        open={!!deletingDividend}
        onOpenChange={(open) => {
          if (!open) setDeletingDividend(null)
        }}
        title="Excluir provento"
        itemName={deletingDividend?.asset.ticker || 'este provento'}
        trailing=" deste lançamento? Esta ação não pode ser desfeita."
        lead="Tem certeza que deseja remover o provento de"
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </div>
  )
}
