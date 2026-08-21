'use client'

import { LogOut, Monitor, Shield, Smartphone, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import {
	changePassword,
	deleteUser,
	listSessions,
	revokeOtherSessions,
	revokeSession,
	signOut,
	useSession
} from '@/shared/lib/auth-client'

interface Session {
	id: string
	token: string
	userAgent?: string | null
	ipAddress?: string | null
	createdAt: Date
	expiresAt: Date
}

export function SettingsTabContent() {
	const router = useRouter()

	const { data: sessionData } = useSession()

	const [isLoading, setIsLoading] = useState(false)
	const [sessions, setSessions] = useState<Session[]>([])
	const [isLoadingSessions, setIsLoadingSessions] = useState(true)

	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	const [deletePassword, setDeletePassword] = useState('')

	useEffect(() => {
		loadSessions()
	}, [])

	async function loadSessions() {
		try {
			setIsLoadingSessions(true)
			const response = await listSessions()
			if (response.data) {
				setSessions(response.data)
			}
		} catch {
			toast.error('Erro ao carregar sessões')
		} finally {
			setIsLoadingSessions(false)
		}
	}

	async function handleChangePassword(e: React.FormEvent) {
		e.preventDefault()

		if (newPassword !== confirmPassword) {
			toast.error('As senhas não coincidem')
			return
		}

		if (newPassword.length < 8) {
			toast.error('A nova senha deve ter pelo menos 8 caracteres')
			return
		}

		setIsLoading(true)
		try {
			const response = await changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true
			})

			if (response.error) {
				toast.error(response.error.message || 'Erro ao alterar senha')
				return
			}

			toast.success('Senha alterada com sucesso!')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch {
			toast.error('Erro ao alterar senha')
		} finally {
			setIsLoading(false)
		}
	}

	async function handleRevokeSession(sessionToken: string) {
		try {
			await revokeSession({ token: sessionToken })
			toast.success('Sessão encerrada com sucesso')
			loadSessions()
		} catch {
			toast.error('Erro ao encerrar sessão')
		}
	}

	async function handleRevokeOtherSessions() {
		try {
			await revokeOtherSessions()
			toast.success('Outras sessões encerradas com sucesso')
			loadSessions()
		} catch {
			toast.error('Erro ao encerrar outras sessões')
		}
	}

	async function handleDeleteAccount() {
		if (!deletePassword) {
			toast.error('Digite sua senha para confirmar')
			return
		}

		try {
			const response = await deleteUser({ password: deletePassword })

			if (response.error) {
				toast.error(response.error.message || 'Erro ao excluir conta')
				return
			}

			toast.success('Conta excluída com sucesso')
			await signOut()
			router.push('/sign-in')
		} catch {
			toast.error('Erro ao excluir conta')
		}
	}

	function getDeviceIcon(userAgent?: string | null) {
		if (!userAgent) return <Monitor className="h-4 w-4" />
		const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
		return isMobile ? (
			<Smartphone className="h-4 w-4" />
		) : (
			<Monitor className="h-4 w-4" />
		)
	}

	function getDeviceName(userAgent?: string | null) {
		if (!userAgent) return 'Dispositivo desconhecido'

		if (/windows/i.test(userAgent)) return 'Windows'
		if (/macintosh|mac os/i.test(userAgent)) return 'macOS'
		if (/linux/i.test(userAgent)) return 'Linux'
		if (/iphone/i.test(userAgent)) return 'iPhone'
		if (/ipad/i.test(userAgent)) return 'iPad'
		if (/android/i.test(userAgent)) return 'Android'

		return 'Navegador Web'
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-primary" />
						Alterar Senha
					</CardTitle>
					<CardDescription>
						Atualize sua senha para manter sua conta segura
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleChangePassword} className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="current-password">Senha Atual</Label>
								<Input
									id="current-password"
									type="password"
									autoComplete="current-password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									disabled={isLoading}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="new-password">Nova Senha</Label>
								<Input
									id="new-password"
									type="password"
									autoComplete="new-password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									disabled={isLoading}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
							<Input
								id="confirm-password"
								type="password"
								autoComplete="new-password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								disabled={isLoading}
							/>
						</div>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? 'Alterando...' : 'Alterar Senha'}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								<Monitor className="h-5 w-5 text-primary" />
								Sessões Ativas
							</CardTitle>
							<CardDescription>
								Gerencie os dispositivos conectados à sua conta
							</CardDescription>
						</div>
						{sessions.length > 1 && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleRevokeOtherSessions}
							>
								<LogOut className="mr-2 h-4 w-4" />
								Encerrar Outras
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingSessions ? (
						<p className="text-muted-foreground text-sm">
							Carregando sessões...
						</p>
					) : sessions.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nenhuma sessão ativa encontrada
						</p>
					) : (
						<div className="space-y-3">
							{sessions.map((session) => {
								const isCurrentSession =
									session.token === sessionData?.session?.token
								return (
									<div
										key={session.id}
										className="flex items-center justify-between rounded-lg border p-3"
									>
										<div className="flex items-center gap-3">
											{getDeviceIcon(session.userAgent)}
											<div>
												<p className="flex items-center gap-2 font-medium text-sm">
													{getDeviceName(session.userAgent)}
													{isCurrentSession && (
														<span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
															Sessão atual
														</span>
													)}
												</p>
												<p className="text-muted-foreground text-xs">
													{session.ipAddress || 'IP desconhecido'} •{' '}
													{new Date(session.createdAt).toLocaleDateString(
														'pt-BR'
													)}
												</p>
											</div>
										</div>
										{!isCurrentSession && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRevokeSession(session.token)}
											>
												<LogOut className="h-4 w-4" />
											</Button>
										)}
									</div>
								)
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<Trash2 className="h-5 w-5" />
						Zona de Perigo
					</CardTitle>
					<CardDescription>Ações irreversíveis para sua conta</CardDescription>
				</CardHeader>
				<CardContent>
					<Separator className="mb-4" />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Excluir Conta</p>
							<p className="text-muted-foreground text-sm">
								Esta ação é permanente e não pode ser desfeita
							</p>
						</div>
						<AlertDialog>
							<AlertDialogTrigger
								render={<Button variant="destructive">Excluir Conta</Button>}
							/>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
									<AlertDialogDescription>
										Esta ação não pode ser desfeita. Isso excluirá
										permanentemente sua conta e removerá todos os seus dados de
										nossos servidores.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<div className="space-y-2 py-4">
									<Label htmlFor="delete-password">
										Digite sua senha para confirmar
									</Label>
									<Input
										id="delete-password"
										type="password"
										value={deletePassword}
										onChange={(e) => setDeletePassword(e.target.value)}
									/>
								</div>
								<AlertDialogFooter>
									<AlertDialogCancel onClick={() => setDeletePassword('')}>
										Cancelar
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteAccount}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Excluir minha conta
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
