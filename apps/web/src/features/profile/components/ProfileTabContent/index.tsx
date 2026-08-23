'use client'

import { env } from '@finance-assets-web/env/web'
import type { User } from 'better-auth'
import { Calendar, Camera, Mail, User2 } from 'lucide-react'
import { useState } from 'react'

import { UploadAvatarModal } from '@/features/profile/components/UploadAvatarModal'
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/shared/components/ui/avatar'
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

interface ProfileTabContentProps {
  user: User
}

export function ProfileTabContent({ user }: ProfileTabContentProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <CardTitle>Foto do Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div
              className="relative"
              onClick={() =>
                document.getElementById('upload-avatar-button')?.click()
              }
            >
              <Avatar className="h-32 w-32 border-4 border-border shadow-lg">
                <AvatarImage
                  src={
                    user?.image
                      ? `${env.NEXT_PUBLIC_AVATAR_URL}${user.image}`
                      : undefined
                  }
                />
                <AvatarFallback className="bg-primary/20 font-bold text-3xl text-primary">
                  {user?.name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -right-2 -bottom-2 h-8 w-8 rounded-full"
                id="upload-avatar-button"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Alterar Foto
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User2 className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  Nome
                </Label>
                <Input id="name" defaultValue={user?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  defaultValue={user?.email || ''}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  disabled
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthdate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Data de Nascimento
                </Label>
                <Input id="birthdate" type="date" disabled />
              </div>
            </div>
            <div className="pt-4">
              <Button>Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <UploadAvatarModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        userId={user?.id}
      />
    </>
  )
}
