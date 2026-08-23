'use client'

import { env } from '@finance-assets-web/env/web'
import { LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import { signOut, useSession } from '@/shared/lib/auth-client'

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ProfileMenu() {
  const router = useRouter()

  const { error, data: userData, isPending } = useSession()

  const user = userData?.user

  const UserHeader = () => {
    if (error || isPending || !user) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-muted" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        {user.image ? (
          <img
            src={`${env.NEXT_PUBLIC_AVATAR_URL}${user.image}`}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary/80 to-primary font-semibold text-primary-foreground text-sm shadow-inner">
            {getInitials(user.name)}
          </div>
        )}
        <div className="flex flex-col">
          <p className="font-semibold text-sm leading-tight">{user.name}</p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-transparent transition-all hover:ring-primary/30 focus-visible:ring-primary/50"
          />
        }
      >
        {user?.image ? (
          <img
            src={`${env.NEXT_PUBLIC_AVATAR_URL}${user.image}`}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/80 to-primary font-semibold text-primary-foreground text-sm">
            {user ? getInitials(user.name) : <User className="h-5 w-5" />}
          </div>
        )}
        <span className="sr-only">Abrir menu de usuário</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-2" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-3 font-normal">
            <UserHeader />
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer gap-3 rounded-md px-3 py-2.5 transition-colors">
            <Link href="/profile" className="flex w-full items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Perfil</span>
                <span className="text-muted-foreground text-xs">
                  Gerencie sua conta
                </span>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem className="cursor-pointer gap-3 rounded-md px-3 py-2.5 transition-colors">
            <Link
              href="/profile?tab=settings"
              className="flex w-full items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Configurações</span>
                <span className="text-muted-foreground text-xs">
                  Preferências do sistema
                </span>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-3 rounded-md px-3 py-2.5 transition-colors"
          onClick={() => {
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.replace('/sign-in')
                  router.refresh()
                }
              }
            })
          }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
            <LogOut className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Sair</span>
            <span className="text-xs opacity-70">Encerrar sessão</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
