import { Wallet } from 'lucide-react'
import type { Metadata } from 'next'

import { ModeToggle } from '@/shared/components/ModeToggle'

export const metadata: Metadata = {
	title: 'Finance Assets - Accounts',
	description: 'Finance Assets'
}

export default function Layout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div className="grid h-svh grid-rows-[auto_1fr]">
			<header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
				<div className="container mx-auto flex h-14 items-center px-4">
					<div className="mr-6 flex items-center space-x-2">
						<Wallet className="h-6 w-6 text-primary" />
						<span className="hidden font-bold sm:inline-block">
							Finance Assets
						</span>
					</div>
					<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
						<div className="w-full flex-1 md:w-auto md:flex-none" />
						<nav className="flex items-center gap-2">
							<ModeToggle />
						</nav>
					</div>
				</div>
			</header>
			{children}
		</div>
	)
}
