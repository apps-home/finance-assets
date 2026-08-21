import { Home, ServerCrash } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'

export const metadata: Metadata = {
	title: 'Serviço Indisponível',
	description: 'O serviço está temporariamente indisponível'
}

export default async function MaintenancePage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="text-center">
				<div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
					<ServerCrash className="h-12 w-12 text-muted-foreground" />
				</div>

				<h1 className="mb-2 font-bold text-8xl text-primary">503</h1>

				<h2 className="mb-4 font-semibold text-2xl text-foreground">
					Serviço em Manutenção
				</h2>

				<p className="mx-auto mb-8 max-w-md text-muted-foreground">
					Estamos realizando melhorias no sistema. Por favor, tente novamente em
					alguns minutos.
				</p>

				<div className="mx-auto mb-8 flex max-w-xs items-center justify-center gap-2 rounded-lg border border-border bg-card p-4">
					<div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
					<span className="text-muted-foreground text-sm">
						Manutenção em andamento
					</span>
				</div>

				<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button variant="outline" asChild>
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Voltar ao início
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
