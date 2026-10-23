'use client'

import { Menu, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ProfileMenu } from '@/features/profile/components/ProfileMenu'
import { Button } from '@/shared/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '@/shared/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/shared/components/ui/sheet'
import { headerMenu } from '@/shared/config/menu'

import { ModeToggle } from '../ModeToggle'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          aria-label="Abrir menu"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="size-5" />
        </Button>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                Finance Assets
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {headerMenu.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2.5 font-medium text-sm transition-colors hover:bg-muted"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center space-x-2 md:mr-6">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Finance Assets
          </span>
        </Link>
        <div className="mr-4 hidden md:flex">
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
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center gap-4">
            <ModeToggle />
            <ProfileMenu />
          </nav>
        </div>
      </div>
    </header>
  )
}
