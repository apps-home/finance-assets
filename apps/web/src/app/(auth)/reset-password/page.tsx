'use client'

import { ArrowLeft, CheckCircle, KeyRound, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { resetPassword } from '@/shared/lib/auth-client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres')
      return
    }

    if (!token) {
      toast.error('Token inválido. Solicite um novo link de recuperação.')
      return
    }

    setIsPending(true)

    try {
      const { error } = await resetPassword({
        newPassword: password,
        token
      })

      if (error) {
        toast.error(error.message || 'Erro ao redefinir senha')
        return
      }

      setIsSuccess(true)
      toast.success('Senha redefinida com sucesso!')
    } catch {
      toast.error('Erro ao redefinir senha')
    } finally {
      setIsPending(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10">
              <KeyRound className="size-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Link inválido</CardTitle>
              <CardDescription className="mt-1">
                O link de recuperação é inválido ou expirou. Solicite um novo
                link.
              </CardDescription>
            </div>
          </CardHeader>

          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full"
              onClick={() => router.push('/forgot-password')}
            >
              Solicitar novo link
            </Button>

            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 text-muted-foreground text-sm hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              Voltar para o login
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <CheckCircle className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Senha redefinida!</CardTitle>
              <CardDescription className="mt-1">
                Sua senha foi alterada com sucesso. Você já pode fazer login com
                sua nova senha.
              </CardDescription>
            </div>
          </CardHeader>

          <CardFooter>
            <Button className="w-full" onClick={() => router.push('/sign-in')}>
              Ir para o login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="size-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Redefinir senha</CardTitle>
            <CardDescription className="mt-1">
              Digite sua nova senha abaixo
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <p className="text-muted-foreground text-xs">
              A senha deve ter pelo menos 8 caracteres
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>

            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 text-muted-foreground text-sm hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              Voltar para o login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
