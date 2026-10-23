import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finance Assets (PWA)',
    short_name: 'Finance Assets (PWA)',
    description: 'Acompanhe e gerencie seus investimentos',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/favicon.ico',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
}
