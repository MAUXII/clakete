"use client"

import Image from "next/image"
import Link from "next/link"
import { List } from "@/types/list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { ListPosterStack } from "@/components/lists/list-poster-stack"
import { listPublicHref, userProfilePath } from "@/lib/list-href"
import { listBannerPresentation } from "@/lib/list-banner"
import { cn } from "@/lib/utils"

function normalizedSlots(list: List): (string | null)[] {
  const first = (list.preview_posters ?? []).slice(0, 5)
  const slots: (string | null)[] = [...first]
  while (slots.length < 5) slots.push(null)
  return slots
}

type Props = {
  list: List
  className?: string
  /** Compact = profile preview / tight rails */
  compact?: boolean
  showCreator?: boolean
}

/**
 * Glass list tile — soft surface + poster stack, not the classic bordered card.
 * Tuned for the ~820px glass shell (reads better as 1–2 cols).
 */
export function ListCardGlass({
  list,
  className,
  compact = false,
  showCreator = true,
}: Props) {
  const displayName = list.userData?.display_name || list.userData?.username || "User"
  const banner = listBannerPresentation(list)
  const bannerSrc = banner.src
  const hasItems = (list.films_count ?? 0) > 0
  const count = list.films_count ?? 0
  const bio = list.bio?.trim() ?? ""
  const listHref = listPublicHref(list)

  if (compact) {
    return (
      <div
        className={cn(
          "group relative flex w-full flex-col overflow-hidden rounded-[16px] bg-white/[0.035] ring-1 ring-white/[0.08] transition-[background,box-shadow] duration-300 hover:bg-white/[0.055] hover:ring-white/[0.14]",
          className,
        )}
      >
        <Link
          href={listHref}
          aria-label={`Open list: ${list.title}`}
          className="absolute inset-0 z-[1] rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        />
        <div className="relative z-[2] flex flex-col gap-3 p-3 pointer-events-none">
          <div className="w-full min-w-0 pt-1">
            <ListPosterStack posters={normalizedSlots(list)} compact />
          </div>
          <div className="min-w-0 space-y-0.5 px-0.5 pb-0.5">
            <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-snug tracking-tight text-white/90">
              {list.title}
            </h3>
            <p className="text-[11px] text-white/40">
              {count} {count === 1 ? "title" : "titles"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative flex min-h-0 w-full flex-col overflow-hidden rounded-[18px] bg-white/[0.035] ring-1 ring-white/[0.08] transition-[background,box-shadow] duration-300 hover:bg-white/[0.055] hover:ring-white/[0.14]",
        className,
      )}
    >
      <Link
        href={listHref}
        aria-label={`Open list: ${list.title}`}
        className="absolute inset-0 z-[1] rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      />

      <div className="relative z-[2] flex min-h-0 flex-1 flex-col pointer-events-none">
        {/* Banner wash */}
        <div className="relative h-[7.5rem] shrink-0 sm:h-[8.5rem]">
          <div className="absolute inset-0 overflow-hidden">
            {bannerSrc ? (
              <>
                <Image
                  src={bannerSrc}
                  alt=""
                  fill
                  sizes="(max-width:640px) 100vw, 420px"
                  style={banner.objectPosition ? { objectPosition: banner.objectPosition } : undefined}
                  className={cn(
                    "object-cover opacity-80 transition-transform duration-500 ease-out group-hover:scale-[1.03]",
                    !banner.objectPosition && "object-center",
                  )}
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#151618]"
                />
              </>
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(255,255,255,0.08),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]"
              />
            )}
          </div>

          {hasItems ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3">
              <div className="absolute bottom-0 left-1/2 w-max -translate-x-1/2 translate-y-[28%]">
                <ListPosterStack posters={normalizedSlots(list)} />
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col gap-2.5 px-4 pb-4",
            hasItems ? "pt-12 sm:pt-14" : "pt-4",
          )}
        >
          <div className="min-w-0 space-y-1">
            <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-white">
              {list.title}
            </h3>
            {bio ? (
              <p className="line-clamp-2 text-[13px] leading-relaxed text-white/45">{bio}</p>
            ) : null}
            <p className="text-[11px] tabular-nums text-white/35">
              {count} {count === 1 ? "title" : "titles"}
            </p>
          </div>

          {showCreator ? (
            <div className="mt-auto flex min-w-0 items-center gap-2.5 border-t border-white/[0.08] pt-3 pointer-events-auto">
              <Link href={userProfilePath(list.userData?.username)} className="shrink-0">
                <Avatar className="h-7 w-7 ring-1 ring-white/15">
                  <AvatarImage src={avatarDisplaySrc(list.userData?.avatar_url)} alt={displayName} />
                  <AvatarFallback className="bg-white/10 text-[10px] font-medium text-white/70">
                    {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
                  Created by
                </p>
                <Link
                  href={userProfilePath(list.userData?.username)}
                  className="block truncate text-sm font-medium text-white/80 transition hover:text-white"
                >
                  {displayName}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
