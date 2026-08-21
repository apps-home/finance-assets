import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { getCurrentUser } from '@/shared/lib/current-user'

import ProfileClient from './ProfileClient'

async function ProfileContent() {
	const user = await getCurrentUser()

	if (!user) {
		redirect('/sign-in')
	}

	return (
		<main>
			<ProfileClient user={user} />
		</main>
	)
}

export default function ProfilePage() {
	return (
		<Suspense>
			<ProfileContent />
		</Suspense>
	)
}

export const metadata: Metadata = {
	title: 'Finance Assets | Perfil',
	description: 'Gerencie as informações do seu perfil e preferências da conta'
}
