import { renderAppIcon } from '@/shared/lib/app-icon'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Ícone da tela de início do iOS: precisa ser opaco (transparência vira preto)
export default function AppleIcon() {
  return renderAppIcon(size.width, { glyphRatio: 0.6 })
}
