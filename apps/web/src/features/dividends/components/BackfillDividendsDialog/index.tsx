'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@lib/ui/components/alert-dialog'
import { DownloadCloud, Loader2 } from 'lucide-react'

interface BackfillDividendsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function BackfillDividendsDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending
}: BackfillDividendsDialogProps) {
  async function handleConfirm(event: React.MouseEvent) {
    event.preventDefault()

    try {
      await onConfirm()
    } catch {
      // o erro já é exibido pelo toast do hook de mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="backfill-dividends-dialog">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <DownloadCloud className="size-5 text-primary" />
          </div>
          <AlertDialogTitle className="text-base">
            Importar últimos 12 meses
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-xs">
            <span className="block">
              Busca os dividendos pagos nos últimos 12 meses de todos os seus
              ativos ativos com ticker (Ações BR, FIIs e Ações US) e registra na
              sua lista. Ativos que já foram importados são pulados, então
              clicar de novo só busca os ativos novos. Lançamentos manuais não
              são alterados.
            </span>
            <span className="block font-medium text-foreground">
              Atenção: o valor é calculado com a quantidade ATUAL de cada ativo.
            </span>
            <span className="block">
              Se você comprou mais cotas ao longo do ano, os meses antigos ficam
              superestimados; se o ativo é novo, podem entrar meses em que você
              ainda não o tinha. Depois da importação, edite esses lançamentos:
              ao mudar a quantidade, o total é recalculado pelo valor por cota,
              ou exclua os meses que não se aplicam.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="text-xs"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Importar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
