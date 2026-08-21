'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { deleteCategory } from '@/features/categories/api'
import type { Category } from '@/features/categories/api/types'
import { Button } from '@/shared/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { queryClient } from '@/shared/providers/query-client'

interface DeleteCategoryDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	category: Category | null
}

export function DeleteCategoryDialog({
	open,
	onOpenChange,
	category
}: DeleteCategoryDialogProps) {
	const { mutateAsync: deleteCategoryMutation } = useMutation({
		mutationFn: deleteCategory,
		onSuccess: () => {
			onOpenChange(false)
			queryClient.invalidateQueries({ queryKey: ['categories'] })
			queryClient.invalidateQueries({ queryKey: ['all-categories'] })
			toast.success('Categoria removida com sucesso!')
		}
	})

	const handleDelete = async () => {
		if (category) {
			try {
				await deleteCategoryMutation(category.id)
			} catch {
				toast.error('Erro ao excluir categoria')
			}
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Confirmar Exclusão</DialogTitle>
					<DialogDescription>
						Tem certeza que deseja excluir a categoria{' '}
						<strong>{category?.name}</strong>? Esta ação não pode ser desfeita.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button variant="destructive" onClick={handleDelete}>
						Excluir Categoria
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
