"use client"

import { useRouter } from "next/navigation"
import { MagneticTabs } from "@/components/ruixen/magnetic-tabs"
import {
  useProfileTabs,
  type ProfileTabId,
} from "@/components/profile/profile-tab-bar"

type ProfileTabBarGlassProps = {
  username: string
  activeTab: ProfileTabId
  /** Contagens estilo Leitour nos chips das tabs. */
  badges?: Partial<Record<ProfileTabId, number | string>>
  children: React.ReactNode
}

/** Leitour MagneticTabs + LiquidGlass, Clakete profile routes. */
export function ProfileTabBarGlass({
  username,
  activeTab,
  badges,
  children,
}: ProfileTabBarGlassProps) {
  const tabs = useProfileTabs()
  const router = useRouter()

  return (
    <div className="w-full">
      <MagneticTabs
        value={activeTab}
        size="lg"
        glass
        className="mt-glass"
        contentBoxed={false}
        sound={false}
        onChange={(value) => {
          const tab = tabs.find((t) => t.id === value)
          if (tab) router.push(tab.href(username))
        }}
        items={tabs.map((tab) => ({
          value: tab.id,
          label: tab.label,
          badge: badges?.[tab.id],
        }))}
      />
      <div className="mt-5 min-w-0">{children}</div>
    </div>
  )
}
