'use client'

import { ArrowLeft, Mail, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
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
import { requestPasswordReset } from '@/shared/lib/auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Digite seu e-mail')
      return
    }

    setIsPending(true)

    try {
      const { error } = await requestPasswordReset({
        email,
        redirectTo: '/reset-password'
      })

      if (error) {
        toast.error(error.message || 'Erro ao enviar e-mail de recuperação')
        return
      }

      setIsEmailSent(true)
      toast.success('E-mail de recuperação enviado!')
    } catch {
      toast.error('Erro ao enviar e-mail de recuperação')
    } finally {
      setIsPending(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="size-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Verifique seu e-mail</CardTitle>
              <CardDescription className="mt-1">
                Enviamos um link de recuperação para{' '}
                <span className="font-medium text-foreground">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 py-4">
            <p className="text-center text-muted-foreground text-sm">
              Não recebeu o e-mail? Verifique sua pasta de spam ou tente
              novamente.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsEmailSent(false)
                setEmail('')
              }}
            >
              Tentar outro e-mail
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Wallet className="size-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Esqueceu sua senha?</CardTitle>
            <CardDescription className="mt-1">
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
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
