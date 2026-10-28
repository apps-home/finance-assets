import { env } from '@finance-assets-web/env/web'
import type { MetadataRoute } from 'next'

import { APP_COLORS } from '@/shared/lib/app-icon'

// URLs do manifest não recebem o basePath automaticamente
const basePath = env.NEXT_PUBLIC_BASE_PATH

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${basePath}/`,
    name: 'Finance Assets',
    short_name: 'Finance',
    description: 'Acompanhe e gerencie seus investimentos',
    lang: 'pt-BR',
    dir: 'ltr',
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: 'standalone',
    background_color: APP_COLORS.background,
    theme_color: APP_COLORS.background,
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: `${basePath}/icon/192`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icon/512`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${basePath}/icon/512`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    // Atalhos ao pressionar o ícone no Android
    shortcuts: [
      { name: 'Meus Ativos', url: `${basePath}/assets` },
      { name: 'Proventos', url: `${basePath}/dividends` },
      { name: 'Rentabilidade', url: `${basePath}/performance` },
      { name: 'Lista de Desejos', url: `${basePath}/wishlist` }
    ]
  }
}
