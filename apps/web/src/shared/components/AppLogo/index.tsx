import { cn } from '@lib/ui/lib/utils'

interface AppLogoProps {
  className?: string
  /** Cor do desenho; o padrão herda a cor do texto (ex.: `text-primary`) */
  color?: string
  size?: number
}

/**
 * Marca do Finance Assets: barras ascendentes com a linha de tendência.
 * Também é usada pelo ImageResponse (ícones, favicon), por isso só usa SVG
 * com atributos simples.
 */
export function AppLogo({
  className,
  color = 'currentColor',
  size
}: AppLogoProps) {
  return (
    <svg
      data-slot="app-logo"
      aria-hidden="true"
      className={cn('size-6 shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
    >
      <rect x="3" y="15" width="4" height="6" rx="1.25" />
      <rect x="10" y="12" width="4" height="9" rx="1.25" />
      <rect x="17" y="9" width="4" height="12" rx="1.25" />
      <path
        d="M3 11.5 9 6.5 13 9 20.5 3M16 3h4.5v4.5"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
