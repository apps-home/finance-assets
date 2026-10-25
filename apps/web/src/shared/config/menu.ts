import {
  Activity,
  BadgeDollarSign,
  Briefcase,
  FlaskConical,
  Home,
  type LucideIcon,
  Star,
  Tags,
  Wallet
} from 'lucide-react'
import type { Route } from 'next'

export interface MenuLink {
  title: string
  path: Route
  icon: LucideIcon
}

export interface MenuGroup {
  title: string
  icon: LucideIcon
  items: MenuLink[]
}

export type MenuEntry = MenuLink | MenuGroup

export function isMenuGroup(entry: MenuEntry): entry is MenuGroup {
  return 'items' in entry
}

// Rotas de desenvolvimento não aparecem em produção
const devMenu: MenuLink[] =
  process.env.NODE_ENV === 'production'
    ? [{ title: 'Testes', path: '/testing', icon: FlaskConical }]
    : [{ title: 'Testes', path: '/testing', icon: FlaskConical }]

export const headerMenu: MenuEntry[] = [
  { title: 'Controle Patrimonial', path: '/', icon: Home },
  {
    title: 'Gestão de Investimentos',
    icon: Wallet,
    items: [
      { title: 'Meus Ativos', path: '/assets', icon: Briefcase },
      { title: 'Minha Carteira', path: '/portfolio', icon: Wallet },
      { title: 'Rentabilidade', path: '/performance', icon: Activity },
      { title: 'Categorias', path: '/categories', icon: Tags }
    ]
  },
  {
    title: 'Acompanhamento',
    icon: Star,
    items: [
      { title: 'Proventos', path: '/dividends', icon: BadgeDollarSign },
      { title: 'Lista de Desejos', path: '/wishlist', icon: Star }
    ]
  },
  ...devMenu
]

/** Rota ativa: "/" só casa exato; as demais casam também sub-rotas */
export function isPathActive(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname.startsWith(path)
}
