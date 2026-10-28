import { renderAppIcon } from '@/shared/lib/app-icon'

const FAVICON_SIZE = 32
const SIZES = [FAVICON_SIZE, 192, 512]

// Servidos em /icon/32 (aba do navegador), /icon/192 e /icon/512 (manifest)
export function generateImageMetadata() {
  return SIZES.map((size) => ({
    id: String(size),
    size: { width: size, height: size },
    contentType: 'image/png'
  }))
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const size = Number(await id)

  if (size === FAVICON_SIZE) {
    return renderAppIcon(size, { glyphRatio: 0.72, rounded: true })
  }

  // Logo dentro da zona segura: o mesmo PNG serve como "any" e "maskable"
  return renderAppIcon(size, { glyphRatio: 0.5 })
}
