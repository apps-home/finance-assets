'use client'

import { Briefcase, FilterX, PlusIcon } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useMemo, useState } from 'react'

import type { CreateAssetDTO } from '@/features/assets/api/types'
import { AssetCard } from '@/features/assets/components/AssetCard'
import { AssetFilters } from '@/features/assets/components/AssetFilters'
import { AssetFormDialog } from '@/features/assets/components/AssetFormDialog'
import { AssetSummaryCards } from '@/features/assets/components/AssetSummaryCards'
import { AssetTable } from '@/features/assets/components/AssetTable'
import { DeleteAssetDialog } from '@/features/assets/components/DeleteAssetDialog'
import { useAssets } from '@/features/assets/hooks/use-assets'
import type { AssetWithCategory } from '@/features/assets/types'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

export default function AssetsClient() {
	const [search, setSearch] = useQueryState('search', { defaultValue: '' })
	const [categoryFilter, setCategoryFilter] = useQueryState('category', {
		defaultValue: 'ALL'
	})
	const [typeFilter, setTypeFilter] = useQueryState('type', {
		defaultValue: 'ALL'
	})
	const [statusFilter, setStatusFilter] = useQueryState('status', {
		defaultValue: 'ALL'
	})
	const [viewMode, setViewMode] = useQueryState<'table' | 'cards'>('view', {
		defaultValue: 'table',
		parse: (v): 'table' | 'cards' => (v === 'cards' ? 'cards' : 'table')
	})

	const [formOpen, setFormOpen] = useState(false)
	const [editingAsset, setEditingAsset] = useState<AssetWithCategory | null>(
		null
	)
	const [deletingAsset, setDeletingAsset] = useState<AssetWithCategory | null>(
		null
	)

	const {
		categories,
		allAssets,
		isLoading,
		createAsset,
		updateAsset,
		deleteAsset,
		isCreating,
		isUpdating,
		isDeleting
	} = useAssets()

	const filteredAssets = useMemo(() => {
		return allAssets.filter((asset) => {
			if (categoryFilter !== 'ALL' && asset.categoryId !== categoryFilter) {
				return false
			}

			if (typeFilter !== 'ALL' && asset.category?.type !== typeFilter) {
				return false
			}

			if (statusFilter === 'ACTIVE' && !asset.isActive) {
				return false
			}
			if (statusFilter === 'INACTIVE' && asset.isActive) {
				return false
			}

			if (search.trim()) {
				const query = search.toLowerCase()
				const matchName = asset.name.toLowerCase().includes(query)
				const matchTicker = (asset.ticker || '').toLowerCase().includes(query)
				const matchBroker = (asset.broker || '').toLowerCase().includes(query)
				if (!matchName && !matchTicker && !matchBroker) {
					return false
				}
			}

			return true
		})
	}, [allAssets, categoryFilter, typeFilter, statusFilter, search])

	const handleResetFilters = () => {
		setSearch('')
		setCategoryFilter('ALL')
		setTypeFilter('ALL')
		setStatusFilter('ALL')
	}

	const handleOpenCreate = () => {
		setEditingAsset(null)
		setFormOpen(true)
	}

	const handleEdit = (asset: AssetWithCategory) => {
		setEditingAsset(asset)
		setFormOpen(true)
	}

	const handleDelete = (asset: AssetWithCategory) => {
		setDeletingAsset(asset)
	}

	const handleSubmitForm = async (catId: string, data: CreateAssetDTO) => {
		if (editingAsset) {
			await updateAsset({
				categoryId: catId,
				id: editingAsset.id,
				data
			})
			setEditingAsset(null)
			setFormOpen(false)
		} else {
			await createAsset({
				categoryId: catId,
				data
			})
			setFormOpen(false)
		}
	}

	if (isLoading) {
		return (
			<div className="bg-background px-6 pt-4 pb-12">
				<div className="mx-auto max-w-screen-2xl space-y-8">
					<div className="flex items-center gap-4">
						<Skeleton className="size-14 rounded-xl" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 rounded-xl" />
						))}
					</div>
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-96 w-full rounded-xl" />
				</div>
			</div>
		)
	}

	const hasAnyAsset = allAssets.length > 0

	return (
		<div data-slot="assets-page" className="bg-background px-6 pt-4 pb-12">
			<div className="mx-auto max-w-screen-2xl space-y-6">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-4">
						<div className="rounded-xl bg-primary/10 p-3">
							<Briefcase className="size-8 text-primary" />
						</div>
						<div>
							<h1 className="font-bold text-3xl text-foreground">Ativos</h1>
							<p className="text-muted-foreground text-xs">
								Gerencie e acompanhe todos os ativos da sua carteira de
								investimentos
							</p>
						</div>
					</div>

					<Button
						onClick={handleOpenCreate}
						className="gap-2 self-start md:self-auto"
					>
						<PlusIcon className="size-4" />
						Novo Ativo
					</Button>
				</div>

				<AssetSummaryCards assets={filteredAssets} />

				<AssetFilters
					categories={categories}
					search={search}
					onSearchChange={setSearch}
					selectedCategory={categoryFilter}
					onCategoryChange={setCategoryFilter}
					selectedType={typeFilter}
					onTypeChange={setTypeFilter}
					selectedStatus={statusFilter}
					onStatusChange={setStatusFilter}
					viewMode={viewMode}
					onViewModeChange={setViewMode}
					onReset={handleResetFilters}
				/>

				{filteredAssets.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border border-border border-dashed py-16 text-center">
						<div className="mb-4 rounded-xl bg-muted/50 p-4">
							{hasAnyAsset ? (
								<FilterX className="size-10 text-muted-foreground/60" />
							) : (
								<Briefcase className="size-10 text-muted-foreground/60" />
							)}
						</div>
						<h3 className="mb-1.5 font-semibold text-base text-foreground">
							{hasAnyAsset
								? 'Nenhum ativo encontrado para os filtros selecionados'
								: 'Nenhum ativo cadastrado'}
						</h3>
						<p className="max-w-sm text-muted-foreground text-xs">
							{hasAnyAsset
								? 'Tente ajustar ou limpar os filtros para visualizar outros ativos.'
								: 'Você ainda não possui ativos cadastrados. Cadastre seu primeiro ativo para acompanhar sua carteira.'}
						</p>

						{hasAnyAsset ? (
							<Button
								variant="outline"
								size="sm"
								onClick={handleResetFilters}
								className="mt-4 text-xs"
							>
								Limpar filtros
							</Button>
						) : (
							<Button
								onClick={handleOpenCreate}
								size="sm"
								className="mt-4 gap-2 text-xs"
							>
								<PlusIcon className="size-3.5" />
								Cadastrar primeiro ativo
							</Button>
						)}
					</div>
				) : viewMode === 'table' ? (
					<AssetTable
						assets={filteredAssets}
						onEdit={handleEdit}
						onDelete={handleDelete}
					/>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
						{filteredAssets.map((asset) => (
							<AssetCard
								key={asset.id}
								asset={asset}
								onEdit={handleEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}
			</div>

			<AssetFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open)
					if (!open) setEditingAsset(null)
				}}
				onSubmit={handleSubmitForm}
				isPending={isCreating || isUpdating}
				categories={categories}
				initialCategoryId={
					categoryFilter !== 'ALL' ? categoryFilter : undefined
				}
				defaultValues={
					editingAsset
						? {
								name: editingAsset.name,
								ticker: editingAsset.ticker || '',
								categoryId: editingAsset.categoryId,
								quantity: editingAsset.quantity,
								averagePrice: editingAsset.averagePrice,
								broker: editingAsset.broker || '',
								isActive: editingAsset.isActive
							}
						: undefined
				}
			/>

			<DeleteAssetDialog
				open={!!deletingAsset}
				onOpenChange={(open) => {
					if (!open) setDeletingAsset(null)
				}}
				assetName={deletingAsset?.name || ''}
				onConfirm={async () => {
					if (deletingAsset) {
						await deleteAsset({
							categoryId: deletingAsset.categoryId,
							id: deletingAsset.id
						})
						setDeletingAsset(null)
					}
				}}
				isPending={isDeleting}
			/>
		</div>
	)
}
