'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Category } from '@/features/categories/api/types'
import { Button } from '@/shared/components/ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/shared/components/ui/select'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { parseValue } from '@/shared/utils/parse-value'

import type {
	CreateWishlistDTO,
	WishlistWithCategory
} from '../../types/wishlist.types'

interface WishlistFormProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: CreateWishlistDTO) => Promise<void>
	isPending: boolean
	categories: Category[]
	initialCategoryId?: string
	editingItem?: WishlistWithCategory | null
}

export function WishlistForm({
	open,
	onOpenChange,
	onSubmit,
	isPending,
	categories,
	initialCategoryId,
	editingItem
}: WishlistFormProps) {
	const [name, setName] = useState('')
	const [ticker, setTicker] = useState('')
	const [categoryId, setCategoryId] = useState('')
	const [targetPrice, setTargetPrice] = useState('')
	const [notes, setNotes] = useState('')

	const isEditing = !!editingItem

	useEffect(() => {
		if (open && editingItem) {
			setName(editingItem.wishlist.name)
			setTicker(editingItem.wishlist.ticker)
			setCategoryId(editingItem.wishlist.categoryId)
			setTargetPrice(
				editingItem.wishlist.targetPrice != null
					? formatCurrencyInput(
							Math.round(editingItem.wishlist.targetPrice * 100).toString()
						)
					: ''
			)
			setNotes(editingItem.wishlist.notes || '')
		} else if (open) {
			setName('')
			setTicker('')
			setCategoryId(
				initialCategoryId || (categories.length > 0 ? categories[0].id : '')
			)
			setTargetPrice('')
			setNotes('')
		}
	}, [open, editingItem, initialCategoryId, categories])

	const selectedCategoryLabel = categories.find(
		(category) => category.id === categoryId
	)?.name

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (!name.trim() || !ticker.trim() || !categoryId) return

		const parsedTargetPrice =
			targetPrice.trim() !== '' ? parseValue(targetPrice) : null

		await onSubmit({
			categoryId,
			name: name.trim(),
			ticker: ticker.trim().toUpperCase(),
			targetPrice:
				parsedTargetPrice != null && !Number.isNaN(parsedTargetPrice)
					? parsedTargetPrice
					: null,
			notes: notes.trim() || null
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent data-slot="wishlist-form-dialog" className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-base">
						{isEditing ? 'Editar Item da Wishlist' : 'Adicionar à Wishlist'}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{isEditing
							? 'Atualize os dados e metas de compra do ativo em monitoramento.'
							: 'Cadastre um ativo para monitorar cotações e definir metas de compra.'}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="wishlist-category" className="font-medium text-xs">
							Categoria *
						</Label>
						<Select
							value={categoryId}
							onValueChange={(val) => {
								if (val) setCategoryId(val)
							}}
							disabled={isPending || isEditing}
						>
							<SelectTrigger id="wishlist-category">
								<SelectValue placeholder="Selecione a categoria">
									{selectedCategoryLabel ?? categoryId}
								</SelectValue>
							</SelectTrigger>
							<SelectContent className="w-full">
								{categories.map((cat) => (
									<SelectItem key={cat.id} value={cat.id} className="mx-2 py-3">
										{cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="wishlist-name" className="font-medium text-xs">
								Nome *
							</Label>
							<Input
								id="wishlist-name"
								placeholder="Ex: Apple, Vale, Bitcoin..."
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isPending}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="wishlist-ticker" className="font-medium text-xs">
								Ticker *
							</Label>
							<Input
								id="wishlist-ticker"
								placeholder="Ex: AAPL, VALE3, BTC..."
								value={ticker}
								onChange={(e) => setTicker(e.target.value.toUpperCase())}
								disabled={isPending}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="wishlist-target-price" className="font-medium text-xs">
							Preço Alvo de Compra (Opcional)
						</Label>
						<Input
							id="wishlist-target-price"
							type="text"
							placeholder="0,00"
							value={targetPrice}
							onChange={(e) =>
								setTargetPrice(formatCurrencyInput(e.target.value))
							}
							disabled={isPending}
						/>
						<p className="text-muted-foreground text-[10px]">
							Defina o preço teto para ser alertado quando o ativo atingir uma oportunidade de aporte.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="wishlist-notes" className="font-medium text-xs">
							Observações / Anotações
						</Label>
						<Input
							id="wishlist-notes"
							placeholder="Ex: Aportar se o Dividend Yield for > 8%..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={isPending}
						/>
					</div>

					<DialogFooter className="gap-2 pt-2">
						<DialogClose
							render={
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isPending}
									className="text-xs"
								>
									Cancelar
								</Button>
							}
						/>
						<Button
							type="submit"
							size="sm"
							disabled={isPending || !name.trim() || !ticker.trim() || !categoryId}
							className="text-xs"
						>
							{isPending && <Loader2 className="size-3.5 animate-spin" />}
							{isEditing ? 'Salvar Alterações' : 'Adicionar Ativo'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
