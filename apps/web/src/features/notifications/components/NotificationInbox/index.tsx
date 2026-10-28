'use client'

import { Inbox } from '@novu/nextjs'

import { useInboxSession } from '@/features/notifications/hooks/use-inbox-session'

type InboxProps = Parameters<typeof Inbox>[0]

/**
 * Cores do design system: o Novu gera os tons com `oklch(from ...)`, então
 * os tokens funcionam direto e acompanham o tema claro e o escuro.
 */
const APPEARANCE: InboxProps['appearance'] = {
  variables: {
    colorPrimary: 'var(--primary)',
    colorPrimaryForeground: 'var(--primary-foreground)',
    colorSecondary: 'var(--muted)',
    colorSecondaryForeground: 'var(--muted-foreground)',
    colorBackground: 'var(--popover)',
    colorForeground: 'var(--popover-foreground)',
    colorNeutral: 'var(--border)',
    // O número do contador fica no branco padrão do Novu, legível nos dois temas
    colorCounter: 'var(--destructive)',
    colorRing: 'var(--ring)',
    borderRadius: 'var(--radius)',
    fontSize: '0.875rem'
  }
}

const LOCALIZATION: InboxProps['localization'] = {
  locale: 'pt-BR',
  'inbox.filters.dropdownOptions.unread': 'Só não lidas',
  'inbox.filters.dropdownOptions.default': 'Lidas e não lidas',
  'inbox.filters.dropdownOptions.archived': 'Arquivadas',
  'inbox.filters.dropdownOptions.snoozed': 'Adiadas',
  'inbox.filters.labels.unread': 'Não lidas',
  'inbox.filters.labels.default': 'Notificações',
  'inbox.filters.labels.archived': 'Arquivadas',
  'inbox.filters.labels.snoozed': 'Adiadas',
  'notifications.emptyNotice': 'Nenhuma notificação por enquanto.',
  'notifications.actions.readAll': 'Marcar todas como lidas',
  'notifications.actions.archiveAll': 'Arquivar todas',
  'notifications.actions.archiveRead': 'Arquivar lidas',
  'notifications.newNotifications': ({ notificationCount }) =>
    `${notificationCount > 99 ? '99+' : notificationCount} ${notificationCount === 1 ? 'nova notificação' : 'novas notificações'}`,
  'notification.actions.read.tooltip': 'Marcar como lida',
  'notification.actions.unread.tooltip': 'Marcar como não lida',
  'notification.actions.archive.tooltip': 'Arquivar',
  'notification.actions.unarchive.tooltip': 'Desarquivar',
  'notification.actions.snooze.tooltip': 'Adiar',
  'notification.actions.unsnooze.tooltip': 'Cancelar adiamento',
  'notification.snoozedUntil': 'Adiada até',
  'preferences.title': 'Preferências',
  'preferences.emptyNotice': 'Nenhuma preferência específica ainda.',
  'preferences.global': 'Preferências gerais',
  'snooze.options.anHourFromNow': 'Daqui a uma hora',
  'snooze.options.customTime': 'Outro horário...',
  'snooze.options.inOneDay': 'Amanhã',
  'snooze.options.inOneWeek': 'Semana que vem'
}

/**
 * Sino de notificações do Novu (alertas de preço). Só aparece quando o
 * backend tem o Novu configurado.
 */
export function NotificationInbox() {
  const { data: session } = useInboxSession()

  if (!session?.enabled) return null

  return (
    <div data-slot="notification-inbox" className="flex items-center">
      <Inbox
        applicationIdentifier={session.applicationIdentifier}
        subscriber={session.subscriberId}
        subscriberHash={session.subscriberHash}
        {...(session.apiUrl && { backendUrl: session.apiUrl })}
        {...(session.socketUrl && { socketUrl: session.socketUrl })}
        appearance={APPEARANCE}
        localization={LOCALIZATION}
      />
    </div>
  )
}
