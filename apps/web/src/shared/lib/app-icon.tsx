import { ImageResponse } from 'next/og'

import { AppLogo } from '@/shared/components/AppLogo'

// Valores em hex dos tokens do tema escuro (--background e --primary), pois o
// manifest, a meta theme-color e o ImageResponse não leem variáveis CSS
export const APP_COLORS = {
  background: '#000000',
  backgroundLight: '#f5f5f5',
  primary: '#00af1f'
}

interface RenderAppIconOptions {
  /** Fração do lado ocupada pelo logo; até ~0,56 cabe na zona segura do maskable */
  glyphRatio: number
  /** Arredonda o fundo (favicon). Ícones de app ficam quadrados: o SO aplica a máscara */
  rounded?: boolean
}

export function renderAppIcon(
  size: number,
  { glyphRatio, rounded = false }: RenderAppIconOptions
) {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: APP_COLORS.background,
        borderRadius: rounded ? size * 0.22 : 0
      }}
    >
      <AppLogo
        color={APP_COLORS.primary}
        size={Math.round(size * glyphRatio)}
      />
    </div>,
    { width: size, height: size }
  )
}
