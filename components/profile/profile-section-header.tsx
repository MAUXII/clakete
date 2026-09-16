"use client"

import { useProfileChrome } from "@/components/providers/profile-layout-context"
import { cn } from "@/lib/utils"

/**
 * Classic: uppercase + optional count + hairline.
 * Glass: only on the Profile tab (`glassMode="soft"`) — Leitour muted title.
 * Other Glass tabs omit the header (`glassMode="hide"`, default).
 */
export function ProfileSectionHeader({
  title,
  countLabel,
  className,
  trailing,
  glassMode = "hide",
}: {
  title: string
  countLabel?: string
  className?: string
  trailing?: React.ReactNode
  /** Soft label on Glass profile tab only; hide on Assistidos / Diary / etc. */
  glassMode?: "soft" | "hide"
}) {
  const chrome = useProfileChrome()

  if (chrome === "glass") {
    if (glassMode === "hide") return null
    return (
      <div
        className={cn(
          "mb-4 flex items-center justify-between gap-3",
          className,
        )}
      >
        <h2 className="text-sm font-medium text-white/70">{title}</h2>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          "flex items-baseline justify-between gap-2",
          className,
        )}
      >
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          {title}
        </h2>
        {countLabel ? (
          <span className="text-xs text-muted-foreground/60">{countLabel}</span>
        ) : null}
        {trailing}
      </div>
      <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
    </>
  )
}
