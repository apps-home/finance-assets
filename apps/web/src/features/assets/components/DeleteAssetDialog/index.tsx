'use client'

import { Loader2, TriangleAlert } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/components/ui/alert-dialog'

interface DeleteAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assetName: string
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function DeleteAssetDialog({
  open,
  onOpenChange,
  assetName,
  onConfirm,
  isPending
}: DeleteAssetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-slot="delete-asset-dialog">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="size-5 text-destructive" />
          </div>
          <AlertDialogTitle className="text-base">
            Remover Ativo
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Tem certeza que deseja remover{' '}
            <span className="font-semibold text-foreground">{assetName}</span>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} className="text-xs">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault()
              await onConfirm()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
