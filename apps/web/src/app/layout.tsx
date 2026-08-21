import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import Providers from '@/shared/providers'
import '../index.css'

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'Finance Assets',
	description: 'Finance Assets'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={`${inter.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
