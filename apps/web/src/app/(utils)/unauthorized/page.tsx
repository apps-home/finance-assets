import { Home, LogIn, ShieldX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'

export const metadata: Metadata = {
	title: 'Acesso Não Autorizado',
	description: 'Você não tem permissão para acessar este recurso'
}

export default function UnauthorizedPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="text-center">
				<div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
					<ShieldX className="h-12 w-12 text-destructive" />
				</div>

				<h1 className="mb-2 font-bold text-8xl text-destructive">403</h1>

				<h2 className="mb-4 font-semibold text-2xl text-foreground">
					Acesso Não Autorizado
				</h2>

				<p className="mx-auto mb-8 max-w-md text-muted-foreground">
					Você não tem permissão para acessar esta página. Se você acredita que
					isso é um erro, entre em contato com o administrador.
				</p>

				<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button asChild>
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Voltar ao início
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="/sign-in">
							<LogIn className="mr-2 h-4 w-4" />
							Fazer login
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
