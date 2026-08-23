'use client'

import { Wallet } from 'lucide-react'
import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/shared/components/ui/navigation-menu'
import { headerMenu } from '@/shared/config/menu'

import { ProfileMenu } from '../../../features/profile/components/ProfileMenu.tsx'
import { ModeToggle } from '../ModeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Finance Assets
            </span>
          </Link>
          <NavigationMenu>
            {headerMenu.map((item) => (
              <NavigationMenuList key={item.path}>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({
                      className: 'hover:bg-transparent'
                    })}
                    asChild
                  >
                    <Link href={item.path}>{item.title}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            ))}
          </NavigationMenu>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none" />
          <nav className="flex items-center gap-4">
            <ModeToggle />
            <ProfileMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}
