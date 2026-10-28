/** Identificadores dos workflows configurados no painel do Novu */
export const NOTIFICATION_WORKFLOWS = {
  PRICE_ALERT: 'price-alert'
} as const

export type NotificationWorkflow =
  (typeof NOTIFICATION_WORKFLOWS)[keyof typeof NOTIFICATION_WORKFLOWS]
