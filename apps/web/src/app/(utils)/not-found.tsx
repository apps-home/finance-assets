import { FileQuestion, Home } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
			<div className="text-center">
				<div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
					<FileQuestion className="h-12 w-12 text-muted-foreground" />
				</div>

				<h1 className="mb-2 font-bold text-8xl text-primary">404</h1>

				<h2 className="mb-4 font-semibold text-2xl text-foreground">
					Página não encontrada
				</h2>

				<p className="mx-auto mb-8 max-w-md text-muted-foreground">
					Desculpe, a página que você está procurando não existe ou foi movida
					para outro endereço.
				</p>

				<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<Button asChild>
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
