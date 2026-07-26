"use client"

import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

export const PROFILE_TAB_IDS = [
  "profile",
  "watched",
  "diary",
  "lists",
  "reviews",
  "watchlist",
] as const

export type ProfileTabId = (typeof PROFILE_TAB_IDS)[number]

export function useProfileTabs() {
  const { t } = useT()
  return useMemo(
    () =>
      [
        { id: "profile" as const, label: t("profileTabs.profile"), href: (username: string) => `/${username}` },
        { id: "watched" as const, label: t("profileTabs.watched"), href: (username: string) => `/${username}/watched` },
        { id: "diary" as const, label: t("profileTabs.diary"), href: (username: string) => `/${username}/diary` },
        { id: "lists" as const, label: t("profileTabs.lists"), href: (username: string) => `/${username}/lists` },
        { id: "reviews" as const, label: t("profileTabs.reviews"), href: (username: string) => `/${username}/reviews` },
        { id: "watchlist" as const, label: t("profileTabs.watchlist"), href: (username: string) => `/${username}/watchlist` },
      ] as const,
    [t],
  )
}
const profileTabLinkClass = "group relative z-10 flex h-full min-h-0 flex-1"

const profileTabTriggerClass = cn(
  "relative z-10 h-full w-full rounded-md bg-transparent px-8 py-2 text-sm font-medium shadow-none transition-colors",
  "text-muted-foreground group-hover:text-foreground dark:group-hover:text-foreground",
  "data-[state=active]:!bg-transparent data-[state=active]:!shadow-none",
  "data-[state=active]:!text-[var(--profile-tab-active)]",
  "dark:data-[state=active]:!text-[var(--profile-tab-active-dark)]",
  "data-[state=active]:group-hover:!text-[var(--profile-tab-active)]",
  "dark:data-[state=active]:group-hover:!text-[var(--profile-tab-active-dark)]",
)

const INDICATOR_SPRING = {
  type: "spring" as const,
  stiffness: 460,
  damping: 22,
  mass: 0.7,
}

interface ProfileTabBarProps {
  username: string
  activeTab: ProfileTabId
  children: React.ReactNode
}

export function ProfileTabBar({ username, activeTab, children }: ProfileTabBarProps) {
  const tabs = useProfileTabs()
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  const [optimisticTab, setOptimisticTab] = useState<ProfileTabId | null>(null)

  const visualTab = optimisticTab ?? activeTab

  useEffect(() => {
    setOptimisticTab(null)
  }, [activeTab])

  const updateIndicator = useCallback(() => {
    const listEl = listRef.current
    const activeIndex = tabs.findIndex((tab) => tab.id === visualTab)
    const activeEl = tabRefs.current[activeIndex]
    if (!listEl || !activeEl) return

    const listRect = listEl.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()

    setIndicator({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    })
  }, [visualTab, tabs])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useLayoutEffect(() => {
    const listEl = listRef.current
    if (!listEl) return

    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(listEl)
    tabRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    window.addEventListener("resize", updateIndicator)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [updateIndicator, visualTab])

  return (
    <Tabs value={visualTab} className="mt-6 w-full">
      <TabsList
        ref={listRef}
        className="relative flex h-12 w-full overflow-hidden border border-border bg-background p-1 text-muted-foreground"
      >
        {indicator ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-1 rounded-md"
            style={{ backgroundColor: "var(--profile-indicator)" }}
            initial={false}
            animate={{
              left: indicator.left,
              width: indicator.width,
            }}
            transition={INDICATOR_SPRING}
          />
        ) : null}

        {tabs.map((tab, index) => (
          <Link
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            href={tab.href(username)}
            className={profileTabLinkClass}
            onClick={() => setOptimisticTab(tab.id)}
          >
            <TabsTrigger className={profileTabTriggerClass} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          </Link>
        ))}
      </TabsList>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0.92, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </Tabs>
  )
}
