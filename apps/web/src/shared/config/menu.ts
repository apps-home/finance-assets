import type { Route } from 'next'

interface MenuItem {
  title: string
  path: Route
}

export const headerMenu: MenuItem[] = [
  {
    title: 'Início',
    path: '/'
  },
  {
    title: 'Categorias',
    path: '/categories'
  },
  {
    title: 'Ativos',
    path: '/assets'
  },
  {
    title: 'Testes',
    path: '/testing'
  }
]
