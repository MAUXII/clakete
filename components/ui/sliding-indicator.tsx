"use client"

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/** Same spring as profile tab bar. */
export const SLIDING_INDICATOR_SPRING = {
  type: "spring" as const,
  stiffness: 460,
  damping: 22,
  mass: 0.7,
}

export type SlidingIndicatorBox = {
  left: number
  top: number
  width: number
  height: number
}

export function useSlidingIndicator(
  activeKey: string,
  containerRef: RefObject<HTMLElement | null>,
  getActiveElement: () => HTMLElement | null,
) {
  const [indicator, setIndicator] = useState<SlidingIndicatorBox | null>(null)

  const updateIndicator = useCallback(() => {
    const listEl = containerRef.current
    const activeEl = getActiveElement()
    if (!listEl || !activeEl) return

    const listRect = listEl.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()

    setIndicator({
      left: tabRect.left - listRect.left,
      top: tabRect.top - listRect.top,
      width: tabRect.width,
      height: tabRect.height,
    })
  }, [containerRef, getActiveElement, activeKey])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useLayoutEffect(() => {
    const listEl = containerRef.current
    if (!listEl) return

    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(listEl)
    const activeEl = getActiveElement()
    if (activeEl) observer.observe(activeEl)

    window.addEventListener("resize", updateIndicator)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateIndicator)
    }
  }, [containerRef, getActiveElement, updateIndicator, activeKey])

  return indicator
}

export function SlidingIndicator({
  indicator,
  className,
}: {
  indicator: SlidingIndicatorBox | null
  className?: string
}) {
  if (!indicator) return null

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute z-0", className)}
      initial={false}
      animate={{
        left: indicator.left,
        top: indicator.top,
        width: indicator.width,
        height: indicator.height,
      }}
      transition={SLIDING_INDICATOR_SPRING}
    />
  )
}

export const TAB_CONTENT_FADE = {
  initial: { opacity: 0.92, y: 2 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: "easeOut" as const },
}
