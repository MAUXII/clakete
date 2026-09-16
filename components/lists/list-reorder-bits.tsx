"use client"

import type { DragStartEvent } from "@dnd-kit/core"
import type { ListItem } from "@/types/list"
import { cn } from "@/lib/utils"

export const REORDER_SHELL_DURATION_S = 0.55
export const REORDER_SHELL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
/** Margem após a animação do padding antes de desmontar o modo reorder. */
export const REORDER_SHELL_MS = Math.ceil(REORDER_SHELL_DURATION_S * 1000) + 90

/** Same TMDB size as the reorder row — avoids a second fetch + flash when the drag overlay mounts. */
export const LIST_REORDER_POSTER_GRID = "w500" as const
export const LIST_REORDER_POSTER_LIST = "w185" as const

export function normalizeDragBox(
  r: { width: number; height: number } | null | undefined,
): { w: number; h: number } | null {
  if (!r) return null
  const w = Math.round(r.width)
  const h = Math.round(r.height)
  if (w < 8 || h < 8) return null
  return { w, h }
}

/** Rect do dnd-kit no start pode vir vazio; usa DOM + rAF como em layouts responsivos. */
export function measureListReorderDragBox(e: DragStartEvent): { w: number; h: number } | null {
  const cur = e.active.rect.current
  const fromKit = normalizeDragBox(cur.initial) ?? normalizeDragBox(cur.translated)
  if (fromKit) return fromKit

  const act = e.activatorEvent
  if (act && "target" in act) {
    const t = act.target
    if (t instanceof Element) {
      const li = t.closest("li")
      if (li) return normalizeDragBox(li.getBoundingClientRect())
    }
  }
  return null
}

/** Tamanho congelado no drag start — evita encolher no drop quando o rect do kit anima/zera. */
export function ListReorderDragPreview({
  film,
  box,
  posterProfile,
  variant,
}: {
  film: ListItem
  box: { w: number; h: number } | null
  posterProfile: typeof LIST_REORDER_POSTER_GRID | typeof LIST_REORDER_POSTER_LIST
  variant: "grid" | "list"
}) {
  const w = box?.w ?? 0
  const h = box?.h ?? 0
  const hasSize = w > 4 && h > 4
  const src = film.poster_path?.trim()
    ? `https://image.tmdb.org/t/p/${posterProfile}${film.poster_path}`
    : null
  return (
    <div
      style={hasSize ? { width: w, height: h } : undefined}
      className={cn(
        variant === "grid" &&
          "overflow-hidden rounded-md border border-black/15 dark:border-white/15",
        variant === "list" && "overflow-hidden rounded",
        !hasSize && variant === "grid" && "aspect-[2/3] w-[5.5rem]",
        !hasSize && variant === "list" && "h-14 w-10",
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted text-xs text-muted-foreground">
          …
        </div>
      )}
    </div>
  )
}
