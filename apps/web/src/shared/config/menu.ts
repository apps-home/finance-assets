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
    title: 'Meus Ativos',
    path: '/assets'
  },
  {
    title: 'Minha Carteira',
    path: '/portfolio'
  },
  {
    title: 'Lista de Desejos',
    path: '/wishlist'
  },
  {
    title: 'Categorias',
    path: '/categories'
  },
  {
    title: 'Testes',
    path: '/testing'
  }
]
