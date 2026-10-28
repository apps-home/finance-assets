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
import { Loader2, TriangleAlert } from 'lucide-react'

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  itemName: string
  lead?: string
  trailing?: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  lead = 'Tem certeza que deseja remover',
  trailing = '? Esta ação não pode ser desfeita.',
  confirmLabel = 'Remover',
  onConfirm,
  isPending
}: ConfirmDeleteDialogProps) {
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
      <AlertDialogContent data-slot="confirm-delete-dialog">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {lead}{' '}
            <span className="font-semibold text-foreground">{itemName}</span>
            {trailing}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
