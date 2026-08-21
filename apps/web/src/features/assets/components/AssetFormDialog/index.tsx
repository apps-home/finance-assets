'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { CreateAssetDTO } from '@/features/assets/api/types'
import type { Category } from '@/features/categories/api/types'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
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

interface AssetFormDefaults {
	name: string
	ticker: string
	categoryId?: string
	quantity: number | null
	averagePrice: number | null
	broker: string
	isActive: boolean
}

interface AssetFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (categoryId: string, data: CreateAssetDTO) => Promise<void>
	isPending: boolean
	categories: Category[]
	initialCategoryId?: string
	defaultValues?: AssetFormDefaults
}

export function AssetFormDialog({
	open,
	onOpenChange,
	onSubmit,
	isPending,
	categories,
	initialCategoryId,
	defaultValues
}: AssetFormDialogProps) {
	const [name, setName] = useState('')
	const [ticker, setTicker] = useState('')
	const [categoryId, setCategoryId] = useState('')
	const [quantity, setQuantity] = useState('')
	const [averagePrice, setAveragePrice] = useState('')
	const [broker, setBroker] = useState('')
	const [isActive, setIsActive] = useState(true)

	const isEditing = !!defaultValues

	useEffect(() => {
		if (open && defaultValues) {
			setName(defaultValues.name)
			setTicker(defaultValues.ticker)
			setCategoryId(
				defaultValues.categoryId || initialCategoryId || categories[0]?.id || ''
			)
			setQuantity(
				defaultValues.quantity != null ? String(defaultValues.quantity) : ''
			)
			setAveragePrice(
				defaultValues.averagePrice != null
					? String(defaultValues.averagePrice)
					: ''
			)
			setBroker(defaultValues.broker || '')
			setIsActive(defaultValues.isActive ?? true)
		} else if (open) {
			setName('')
			setTicker('')
			setCategoryId(
				initialCategoryId || (categories.length > 0 ? categories[0].id : '')
			)
			setQuantity('')
			setAveragePrice('')
			setBroker('')
			setIsActive(true)
		}
	}, [open, defaultValues, initialCategoryId, categories])
	const selectedCategoryLabel = categories.find(
		(category) => category.id === categoryId
	)?.name

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (!name.trim() || !categoryId) return

		const parsedQuantity = quantity ? Number(quantity) : undefined
		const parsedAveragePrice = averagePrice ? Number(averagePrice) : undefined

		await onSubmit(categoryId, {
			name: name.trim(),
			ticker: ticker.trim() || undefined,
			quantity:
				parsedQuantity != null && !Number.isNaN(parsedQuantity)
					? parsedQuantity
					: undefined,
			averagePrice:
				parsedAveragePrice != null && !Number.isNaN(parsedAveragePrice)
					? parsedAveragePrice
					: undefined,
			broker: broker.trim() || undefined,
			isActive
		})
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent data-slot="asset-form-dialog" className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-base">
						{isEditing ? 'Editar Ativo' : 'Novo Ativo'}
					</DialogTitle>
					<DialogDescription className="text-xs">
						{isEditing
							? 'Atualize as informações do ativo da sua carteira.'
							: 'Cadastre um novo ativo informando a categoria correspondente.'}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="asset-category" className="font-medium text-xs">
							Categoria *
						</Label>
						<Select
							value={categoryId}
							onValueChange={(val) => {
								if (val) setCategoryId(val)
							}}
							disabled={isPending || (isEditing && !!defaultValues.categoryId)}
						>
							<SelectTrigger id="asset-category">
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
							<Label htmlFor="asset-name" className="font-medium text-xs">
								Nome *
							</Label>
							<Input
								id="asset-name"
								placeholder="Ex: Nubank, Tesouro Selic..."
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={isPending}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="asset-ticker" className="font-medium text-xs">
								Ticker
							</Label>
							<Input
								id="asset-ticker"
								placeholder="Ex: PETR4, AAPL, BTC..."
								value={ticker}
								onChange={(e) => setTicker(e.target.value)}
								disabled={isPending}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="asset-quantity" className="font-medium text-xs">
								Quantidade
							</Label>
							<Input
								id="asset-quantity"
								type="number"
								step="any"
								min="0"
								placeholder="Ex: 10, 0.5..."
								value={quantity}
								onChange={(e) => setQuantity(e.target.value)}
								disabled={isPending}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="asset-avg-price" className="font-medium text-xs">
								Preço Médio
							</Label>
							<Input
								id="asset-avg-price"
								type="number"
								step="any"
								min="0"
								placeholder="Ex: 25.50"
								value={averagePrice}
								onChange={(e) => setAveragePrice(e.target.value)}
								disabled={isPending}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="asset-broker" className="font-medium text-xs">
							Corretora
						</Label>
						<Input
							id="asset-broker"
							placeholder="Ex: XP, Inter, Binance, Nubank..."
							value={broker}
							onChange={(e) => setBroker(e.target.value)}
							disabled={isPending}
						/>
					</div>

					<div className="flex items-center gap-2 pt-1">
						<Checkbox
							id="asset-active"
							checked={isActive}
							onCheckedChange={(checked) => setIsActive(checked === true)}
							disabled={isPending}
						/>
						<Label htmlFor="asset-active" className="cursor-pointer text-xs">
							Ativo em carteira
						</Label>
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
							disabled={isPending || !name.trim() || !categoryId}
							className="text-xs"
						>
							{isPending && <Loader2 className="size-3.5 animate-spin" />}
							{isEditing ? 'Salvar Alterações' : 'Criar Ativo'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
