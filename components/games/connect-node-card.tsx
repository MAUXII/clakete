"use client"

import { cn } from "@/lib/utils"
import {
  type ConnectNode,
  tmdbPosterUrl,
} from "@/lib/games/connect-the-stars"

type Props = {
  node: ConnectNode
  selected?: boolean
  onClick?: () => void
  size?: "sm" | "md" | "lg"
  className?: string
  nodeRef?: (el: HTMLButtonElement | HTMLDivElement | null) => void
  asButton?: boolean
}

export function ConnectNodeCard({
  node,
  selected,
  onClick,
  size = "md",
  className,
  nodeRef,
  asButton = true,
}: Props) {
  const src = tmdbPosterUrl(node.imagePath, size === "sm" ? "w92" : "w185")
  const dims =
    size === "sm"
      ? "h-14 w-14"
      : size === "lg"
        ? "h-28 w-28 sm:h-32 sm:w-32"
        : "h-24 w-20 sm:h-28 sm:w-24"

  const inner = (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-muted",
          dims,
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            ?
          </div>
        )}
      </div>
      <div className="min-w-0 text-center">
        <p className="truncate text-xs font-medium text-foreground sm:text-sm">
          {node.name}
        </p>
        {node.subtitle ? (
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
            {node.subtitle}
          </p>
        ) : null}
      </div>
    </>
  )

  const sharedClass = cn(
    "flex flex-col items-center gap-2 rounded-2xl p-2 transition",
    selected && "bg-brand/10 ring-1 ring-brand/40",
    asButton &&
      "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
    className,
  )

  if (!asButton) {
    return (
      <div
        ref={nodeRef as (el: HTMLDivElement | null) => void}
        className={sharedClass}
      >
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      ref={nodeRef as (el: HTMLButtonElement | null) => void}
      onClick={onClick}
      className={sharedClass}
    >
      {inner}
    </button>
  )
}
