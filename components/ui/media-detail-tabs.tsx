"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SlidingIndicator,
  TAB_CONTENT_FADE,
  useSlidingIndicator,
} from "@/components/ui/sliding-indicator"
import { cn } from "@/lib/utils"

export type MediaDetailTab = {
  value: string
  label: string
  content: ReactNode
}

type MediaDetailTabsProps = {
  tabs: MediaDetailTab[]
  defaultValue?: string
  /** Grid columns on sm+ (film=4, series=5). */
  columns?: 4 | 5
  className?: string
}

export function MediaDetailTabs({
  tabs,
  defaultValue,
  columns = 4,
  className,
}: MediaDetailTabsProps) {
  const initial = defaultValue ?? tabs[0]?.value ?? ""
  const [value, setValue] = useState(initial)
  const listRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])

  const getActiveElement = useCallback(() => {
    const index = tabs.findIndex((tab) => tab.value === value)
    return triggerRefs.current[index] ?? null
  }, [tabs, value])

  const indicator = useSlidingIndicator(value, listRef, getActiveElement)

  return (
    <Tabs
      value={value}
      onValueChange={setValue}
      className={cn("w-full", className)}
    >
      <TabsList
        ref={listRef}
        className={cn(
          "relative flex h-auto w-full flex-wrap gap-1 overflow-hidden rounded-lg border border-border bg-transparent p-1",
          columns === 5
            ? "sm:grid sm:grid-cols-5 sm:gap-1"
            : "sm:grid sm:grid-cols-4 sm:gap-1",
        )}
      >
        <SlidingIndicator
          indicator={indicator}
          className="rounded-md bg-brand/10"
        />
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab.value}
            ref={(el) => {
              triggerRefs.current[index] = el
            }}
            value={tab.value}
            className={cn(
              "relative z-10 min-w-0 flex-1 rounded-md bg-transparent px-3 py-2.5 text-center text-sm font-medium shadow-none",
              "text-muted-foreground transition-colors hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/25 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              "data-[state=active]:!bg-transparent data-[state=active]:!shadow-none",
              "data-[state=active]:!text-brand-muted",
              "dark:data-[state=active]:!text-brand-light",
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-6 w-full outline-none"
        >
          <motion.div
            key={tab.value}
            initial={TAB_CONTENT_FADE.initial}
            animate={TAB_CONTENT_FADE.animate}
            transition={TAB_CONTENT_FADE.transition}
          >
            {tab.content}
          </motion.div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
