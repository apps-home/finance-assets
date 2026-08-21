'use client'

import { useHotkey } from '@tanstack/react-hotkeys'
import { ExternalLink, Send } from 'lucide-react'
import { useRef, useState } from 'react'

import { getNode } from '@/infrastructure/api/node'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

const FREEDIUM_PREFIX = 'https://freedium-mirror.cfd/'

export default function TestingClient() {
	const [link, setLink] = useState('')
	const [request, setRequest] = useState('')

	const inputRef = useRef<HTMLInputElement>(null)

	function handleOpenLink() {
		if (!link.trim()) return

		const freediumUrl = `${FREEDIUM_PREFIX}${link.trim()}`
		window.open(freediumUrl, '_blank')
		setLink('')
	}

	const sendGETRequest = async () => {
		if (!request.trim()) return

		const data = await getNode()

		console.log('data', data)

		setRequest('')
	}

	useHotkey('Enter', handleOpenLink, { target: inputRef })

	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="w-full max-w-2xl space-y-6">
				<div className="space-y-1">
					<h1 className="font-semibold text-foreground text-lg">Testing Lab</h1>
					<p className="text-muted-foreground text-xs">
						Área de testes e aprendizados — websockets, filas, IAs, MCPs e mais.
					</p>
				</div>

				<div className="space-y-3 rounded-lg border border-border bg-card p-4">
					<h2 className="font-medium text-foreground text-sm">
						Medium → Freedium
					</h2>
					<p className="text-muted-foreground text-xs">
						Cole um link do Medium abaixo para abrir via Freedium em uma nova
						guia.
					</p>

					<div className="flex gap-2">
						<Input
							type="url"
							placeholder="https://medium.com/..."
							value={link}
							onChange={(e) => setLink(e.target.value)}
							ref={inputRef}
							className="flex-1"
							autoFocus
						/>
						<Button
							onClick={handleOpenLink}
							disabled={!link.trim()}
							size="default"
						>
							<ExternalLink data-icon="inline-start" />
							Abrir
						</Button>
					</div>
				</div>

				<div className="space-y-3 rounded-lg border border-border bg-card p-4">
					<h2 className="font-medium text-foreground text-sm">
						Requisições teste
					</h2>
					<p className="text-muted-foreground text-xs">
						Faça requisições para a API TESTE. (Em desenvolvimento)
					</p>

					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Requisição teste"
							value={request}
							onChange={(e) => setRequest(e.target.value)}
							className="flex-1"
						/>
						<Button
							onClick={sendGETRequest}
							disabled={!request.trim()}
							size="default"
						>
							<Send data-icon="inline-start" />
							Enviar
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
