import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import DashboardClient from './DashboardClient'

export interface MonthData {
	month: string
	monthIndex: number
	[key: string]: string | number
}

async function DashboardContent() {
	const user = await getCurrentUser()

	if (!user) {
		redirect('/sign-in')
	}

	return <DashboardClient />
}

export default function DashboardPage() {
	return (
		<Suspense>
			<DashboardContent />
		</Suspense>
	)
}

export const metadata: Metadata = {
	title: 'Finance Assets | Dashboard',
	description: 'Finance Assets'
}
