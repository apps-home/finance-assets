'use client'

import { AlertOctagon, RotateCcw } from 'lucide-react'

interface GlobalErrorProps {
	error: Error & { digest?: string }
	reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
	return (
		<html lang="pt-BR">
			<body>
				<div
					style={{
						display: 'flex',
						minHeight: '100vh',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: '#0a0a0a',
						color: '#fafafa',
						padding: '1rem',
						fontFamily: 'system-ui, sans-serif'
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<div
							style={{
								margin: '0 auto 2rem',
								display: 'flex',
								height: '6rem',
								width: '6rem',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: '50%',
								backgroundColor: 'rgba(239, 68, 68, 0.1)'
							}}
						>
							<AlertOctagon
								style={{ height: '3rem', width: '3rem', color: '#ef4444' }}
							/>
						</div>

						<h1
							style={{
								marginBottom: '1rem',
								fontSize: '5rem',
								fontWeight: 'bold',
								color: '#ef4444'
							}}
						>
							Erro
						</h1>

						<h2
							style={{
								marginBottom: '1rem',
								fontSize: '1.5rem',
								fontWeight: '600'
							}}
						>
							Erro crítico na aplicação
						</h2>

						<p
							style={{
								marginBottom: '2rem',
								maxWidth: '28rem',
								color: '#a1a1aa'
							}}
						>
							Ocorreu um erro crítico que impediu o carregamento da aplicação.
							Por favor, tente recarregar a página.
						</p>

						{error.digest && (
							<p
								style={{
									marginBottom: '2rem',
									fontFamily: 'monospace',
									fontSize: '0.75rem',
									color: '#71717a'
								}}
							>
								ID do erro: {error.digest}
							</p>
						)}

						<button
							type="button"
							onClick={reset}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: '0.5rem',
								padding: '0.75rem 1.5rem',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#0a0a0a',
								backgroundColor: '#22c55e',
								border: 'none',
								borderRadius: '0.375rem',
								cursor: 'pointer'
							}}
						>
							<RotateCcw style={{ height: '1rem', width: '1rem' }} />
							Recarregar aplicação
						</button>
					</div>
				</div>
			</body>
		</html>
	)
}
