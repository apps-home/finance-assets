'use client'

import type { User } from 'better-auth'
import { Settings, User2 } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Activity } from 'react'

import { ProfileTabContent } from '@/features/profile/components/ProfileTabContent'
import { SettingsTabContent } from '@/features/profile/components/SettingsTabContent'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components/ui/tabs'

interface ProfileClientProps {
  user: User
}

const TABS = {
  PROFILE: 'profile',
  SETTINGS: 'settings'
} as const

const TABS_LIST = [
  {
    value: TABS.PROFILE,
    label: 'Perfil',
    icon: User2
  },
  {
    value: TABS.SETTINGS,
    label: 'Configurações e Segurança',
    icon: Settings
  }
]

export default function ProfileClient({ user }: ProfileClientProps) {
  const [tab, setTab] = useQueryState('tab', {
    defaultValue: TABS.PROFILE,
    shallow: false
  })

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-3xl text-foreground">
            Minha Conta
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações e configurações
          </p>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value)}
          className="space-y-6"
        >
          <TabsList variant="line" className="w-full justify-start gap-4">
            {TABS_LIST.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="cursor-pointer gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS_LIST.map((tabItem) => (
            <TabsContent
              key={tabItem.value}
              value={tabItem.value}
              className="space-y-6"
              keepMounted
            >
              <Activity mode={tab === tabItem.value ? 'visible' : 'hidden'}>
                {tabItem.value === TABS.PROFILE ? (
                  <ProfileTabContent user={user} />
                ) : (
                  <SettingsTabContent />
                )}
              </Activity>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
