'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { CreateAssetDTO } from '@/features/assets/api/types'
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

interface AssetFormDefaults {
	name: string
	ticker: string
	quantity: number | null
	averagePrice: number | null
	broker: string
	isActive: boolean
}

interface AssetFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (data: CreateAssetDTO) => Promise<void>
	isPending: boolean
	categoryName: string
	defaultValues?: AssetFormDefaults
}

export function AssetFormDialog({
	open,
	onOpenChange,
	onSubmit,
	isPending,
	categoryName,
	defaultValues
}: AssetFormDialogProps) {
	const [name, setName] = useState('')
	const [ticker, setTicker] = useState('')
	const [quantity, setQuantity] = useState('')
	const [averagePrice, setAveragePrice] = useState('')
	const [broker, setBroker] = useState('')
	const [isActive, setIsActive] = useState(true)

	const isEditing = !!defaultValues

	useEffect(() => {
		if (open && defaultValues) {
			setName(defaultValues.name)
			setTicker(defaultValues.ticker)
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
			setQuantity('')
			setAveragePrice('')
			setBroker('')
			setIsActive(true)
		}
	}, [open, defaultValues])

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()

		if (!name.trim()) return

		const parsedQuantity = quantity ? Number(quantity) : undefined
		const parsedAveragePrice = averagePrice ? Number(averagePrice) : undefined

		await onSubmit({
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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditing ? 'Editar Ativo' : 'Novo Ativo'}</DialogTitle>
					<DialogDescription>
						{isEditing
							? `Atualize as informações do ativo em ${categoryName}.`
							: `Adicione um novo ativo à categoria ${categoryName}.`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="asset-name">Nome *</Label>
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
							<Label htmlFor="asset-ticker">Ticker</Label>
							<Input
								id="asset-ticker"
								placeholder="Ex: NFLX, NVDA, BTC..."
								value={ticker}
								onChange={(e) => setTicker(e.target.value)}
								disabled={isPending}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="asset-quantity">Quantidade</Label>
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
							<Label htmlFor="asset-avg-price">Preço Médio</Label>
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
						<Label htmlFor="asset-broker">Corretora</Label>
						<Input
							id="asset-broker"
							placeholder="Ex: XP, Inter, Binance..."
							value={broker}
							onChange={(e) => setBroker(e.target.value)}
							disabled={isPending}
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id="asset-active"
							checked={isActive}
							onCheckedChange={(checked) => setIsActive(checked === true)}
							disabled={isPending}
						/>
						<Label htmlFor="asset-active" className="cursor-pointer text-sm">
							Ativo em carteira
						</Label>
					</div>

					<DialogFooter>
						<DialogClose
							render={
								<Button type="button" variant="outline" disabled={isPending}>
									Cancelar
								</Button>
							}
						/>
						<Button type="submit" disabled={isPending || !name.trim()}>
							{isPending && <Loader2 className="size-4 animate-spin" />}
							{isEditing ? 'Salvar' : 'Criar'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
