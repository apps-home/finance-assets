import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import CategoriesClient from './CategoriesClient'

async function CategoriesContent() {
	const user = await getCurrentUser()

	if (!user) {
		redirect('/sign-in')
	}

	return <CategoriesClient />
}

export default function CategoriesPage() {
	return (
		<Suspense>
			<CategoriesContent />
		</Suspense>
	)
}

export const metadata: Metadata = {
	title: 'Finance Assets | Categorias',
	description: 'Gerencie suas categorias de investimentos e metas de alocação'
}
