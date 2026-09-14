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
    title: 'Meus Ativos',
    path: '/assets'
  },
  {
    title: 'Lista de Desejos',
    path: '/wishlist'
  },
  {
    title: 'Testes',
    path: '/testing'
  }
]
