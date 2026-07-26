"use client"

import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useT } from "@/components/providers/i18n-provider"
import { prefetchDiaryArt } from "@/lib/client/diary-dialog-art"
import { filmHref, seriesHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"

interface PosterActionsMenuProps {
  mediaType: "movie" | "tv"
  tmdbId: number
  title?: string
  releaseDate?: string | null
  posterPath?: string | null
  isInWatchlist?: boolean
  disabled?: boolean
  onLogToDiary: () => void
  onToggleWatchlist: () => void
  className?: string
}

export function PosterActionsMenu({
  mediaType,
  tmdbId,
  title,
  releaseDate,
  posterPath,
  isInWatchlist = false,
  disabled = false,
  onLogToDiary,
  onToggleWatchlist,
  className,
}: PosterActionsMenuProps) {
  const { t } = useT()

  const detailHref =
    mediaType === "tv"
      ? seriesHref({ id: tmdbId, name: title })
      : filmHref({
          id: tmdbId,
          title,
          release_date: releaseDate,
        })

  const warmArt = () => {
    if (!tmdbId) return
    void prefetchDiaryArt(mediaType, tmdbId, posterPath)
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) warmArt()
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onPointerEnter={warmArt}
          className={cn(
            "rounded-md border border-transparent bg-secondary p-2 text-secondary-foreground transition-colors hover:border-brand/20 hover:bg-[#280F16] hover:text-brand",
            className,
          )}
          title={t("common.more")}
          aria-label={t("common.more")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            warmArt()
            onLogToDiary()
          }}
        >
          {t("watch.menuLogToDiary")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleWatchlist()
          }}
        >
          {isInWatchlist
            ? t("watch.menuRemoveWatchlist")
            : t("watch.menuAddWatchlist")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={detailHref} onClick={(e) => e.stopPropagation()}>
            {t("watch.menuViewTitle")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
