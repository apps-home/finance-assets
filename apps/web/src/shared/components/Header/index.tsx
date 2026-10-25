'use client'

import { ChevronDown, Menu, Wallet } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { ProfileMenu } from '@/features/profile/components/ProfileMenu'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/shared/components/ui/sheet'
import {
  headerMenu,
  isMenuGroup,
  isPathActive,
  type MenuGroup,
  type MenuLink
} from '@/shared/config/menu'
import { cn } from '@/shared/lib/utils'

import { ModeToggle } from '../ModeToggle'

const NAV_ITEM_CLASSES =
  'inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 font-medium text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/50'

function DesktopLink({ item, pathname }: { item: MenuLink; pathname: string }) {
  const active = isPathActive(pathname, item.path)

  return (
    <Link
      href={item.path}
      aria-current={active ? 'page' : undefined}
      className={cn(
        NAV_ITEM_CLASSES,
        active ? 'bg-muted text-foreground' : 'text-muted-foreground'
      )}
    >
      {item.title}
    </Link>
  )
}

function DesktopGroup({
  group,
  pathname
}: {
  group: MenuGroup
  pathname: string
}) {
  const active = group.items.some((item) => isPathActive(pathname, item.path))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          NAV_ITEM_CLASSES,
          'cursor-pointer data-popup-open:bg-muted',
          active ? 'bg-muted text-foreground' : 'text-muted-foreground'
        )}
      >
        {group.title}
        <ChevronDown className="size-3 in-data-popup-open:rotate-180 transition-transform" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-1">
        {group.items.map((item) => (
          <DropdownMenuItem
            key={item.path}
            render={<Link href={item.path} />}
            className={cn(
              'gap-2 px-2.5 py-4',
              isPathActive(pathname, item.path) && 'bg-muted font-medium'
            )}
          >
            <item.icon className="text-muted-foreground" />
            {item.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileLink({
  item,
  pathname,
  onNavigate
}: {
  item: MenuLink
  pathname: string
  onNavigate: () => void
}) {
  const active = isPathActive(pathname, item.path)

  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 font-medium text-sm transition-colors hover:bg-muted',
        active && 'bg-muted'
      )}
    >
      <item.icon className="size-4 text-muted-foreground" />
      {item.title}
    </Link>
  )
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header
      data-slot="header"
      className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/60"
    >
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
            <nav className="flex flex-col gap-1 overflow-y-auto px-4">
              {headerMenu.map((entry) =>
                isMenuGroup(entry) ? (
                  <div key={entry.title} className="mt-3 flex flex-col gap-1">
                    <span className="px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      {entry.title}
                    </span>
                    {entry.items.map((item) => (
                      <MobileLink
                        key={item.path}
                        item={item}
                        pathname={pathname}
                        onNavigate={closeMobileMenu}
                      />
                    ))}
                  </div>
                ) : (
                  <MobileLink
                    key={entry.path}
                    item={entry}
                    pathname={pathname}
                    onNavigate={closeMobileMenu}
                  />
                )
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center space-x-2 md:mr-6">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">
            Finance Assets
          </span>
        </Link>
        <nav
          aria-label="Principal"
          className="mr-4 hidden items-center gap-1 md:flex"
        >
          {headerMenu.map((entry) =>
            isMenuGroup(entry) ? (
              <DesktopGroup
                key={entry.title}
                group={entry}
                pathname={pathname}
              />
            ) : (
              <DesktopLink key={entry.path} item={entry} pathname={pathname} />
            )
          )}
        </nav>
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
