"use client"

import Link from "next/link"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const PROFILE_TABS = [
  { id: "profile", label: "Profile", href: (username: string) => `/${username}` },
  { id: "watched", label: "Watched", href: (username: string) => `/${username}/watched` },
  { id: "lists", label: "Lists", href: (username: string) => `/${username}/lists` },
  { id: "reviews", label: "Reviews", href: (username: string) => `/${username}/reviews` },
  { id: "activity", label: "Activity", href: (username: string) => `/${username}/activity` },
  { id: "watchlist", label: "Watchlist", href: (username: string) => `/${username}/watchlist` },
] as const

export type ProfileTabId = (typeof PROFILE_TABS)[number]["id"]

const profileTabLinkClass = "group relative z-10 flex h-full min-h-0 flex-1"

const profileTabTriggerClass = cn(
  "relative z-10 h-full w-full rounded-md bg-transparent px-8 py-2 text-sm font-medium shadow-none transition-colors",
  "text-zinc-400 group-hover:text-zinc-200 dark:group-hover:text-zinc-100",
  "data-[state=active]:!bg-transparent data-[state=active]:!text-[#e8486b] data-[state=active]:!shadow-none",
  "dark:data-[state=active]:!text-[#ff9eb0]",
  "data-[state=active]:group-hover:!text-[#e8486b] dark:data-[state=active]:group-hover:!text-[#ff9eb0]",
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
    const activeIndex = PROFILE_TABS.findIndex((tab) => tab.id === visualTab)
    const activeEl = tabRefs.current[activeIndex]
    if (!listEl || !activeEl) return

    const listRect = listEl.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()

    setIndicator({
      left: tabRect.left - listRect.left,
      width: tabRect.width,
    })
  }, [visualTab])

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
        className="relative flex h-12 w-full overflow-hidden border border-white/[0.08] bg-[#09090B] p-1 text-zinc-400 dark:bg-[#09090B]"
      >
        {indicator ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-1 rounded-md bg-[#FF0048]/10 dark:bg-[#FF0048]/14"
            initial={false}
            animate={{
              left: indicator.left,
              width: indicator.width,
            }}
            transition={INDICATOR_SPRING}
          />
        ) : null}

        {PROFILE_TABS.map((tab, index) => (
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
