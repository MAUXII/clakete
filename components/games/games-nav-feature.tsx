"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useT } from "@/components/providers/i18n-provider"
import {
  pickRandomSeeds,
  tmdbPosterUrl,
} from "@/lib/games/connect-the-stars"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type Face = { name: string; imagePath: string | null }

/** Survives mega-menu unmount so closing/opening doesn't refetch. */
let cachedFaces: Face[] | null = null
let facesLoad: Promise<Face[]> | null = null

function loadNavFaces(): Promise<Face[]> {
  if (cachedFaces) return Promise.resolve(cachedFaces)
  if (facesLoad) return facesLoad

  facesLoad = (async () => {
    const seeds = pickRandomSeeds(2)
    const loaded = await Promise.all(
      seeds.map(async (s) => {
        try {
          const res = await fetch(`/api/games/person/${s.id}`)
          if (!res.ok) throw new Error("fail")
          const data = (await res.json()) as {
            name: string
            imagePath: string | null
          }
          return { name: data.name, imagePath: data.imagePath }
        } catch {
          return { name: s.name, imagePath: null }
        }
      }),
    )
    cachedFaces = loaded
    return loaded
  })()

  return facesLoad
}

/**
 * Left mega-menu tile for Games — same shell/specs as MovieCard/SeriesCard `nav-fill`
 * (full-height column, rounded-xl, border), but Connect the Stars artwork instead of a poster.
 */
export function GamesNavFeature({ className }: { className?: string }) {
  const { t } = useT()
  const [faces, setFaces] = useState<Face[] | null>(() => cachedFaces)

  useEffect(() => {
    if (cachedFaces) {
      setFaces(cachedFaces)
      return
    }
    let cancelled = false
    void loadNavFaces().then((loaded) => {
      if (!cancelled) setFaces(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!faces) {
    return (
      <Skeleton
        className={cn(
          "absolute inset-0 h-full w-full rounded-xl bg-muted",
          className,
        )}
      />
    )
  }

  const a = faces[0]
  const b = faces[1]
  const aSrc = a ? tmdbPosterUrl(a.imagePath, "w500") : null
  const bSrc = b ? tmdbPosterUrl(b.imagePath, "w500") : null

  return (
    <Link
      href="/games"
      className={cn("group flex h-full w-full flex-col", className)}
    >
      <div
        className={cn(
          "relative h-full flex-1 overflow-hidden rounded-xl bg-muted",
          "border-[1px] border-black/15 shadow-sm shadow-black/5",
          "dark:border-white/15 dark:shadow-white/5",
        )}
      >
        <div className="absolute inset-0 flex">
          <div className="relative h-full w-1/2 overflow-hidden">
            {aSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={aSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-lg font-medium">
                ?
              </div>
            )}
          </div>
          <div className="relative h-full w-1/2 overflow-hidden">
            {bSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-lg font-medium">
                ?
              </div>
            )}
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.18) 1px, transparent 1.2px)`,
            backgroundSize: "14px 14px",
          }}
        />

        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] flex w-px -translate-x-1/2 items-center justify-center">
          <span className="h-[55%] w-px bg-brand/70" />
        </div>
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[2] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand/40 bg-background/90 text-[10px] font-semibold tracking-wider text-brand shadow-sm backdrop-blur-sm">
          ↔
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2.5 pb-2.5 pt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
            {t("nav.games")}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-white">
            {t("games.hubTitle")}
          </p>
        </div>
      </div>
    </Link>
  )
}
