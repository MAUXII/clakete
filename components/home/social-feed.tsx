"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Heart, MessageCircle, Plus, Share, ChevronLeft, ChevronRight } from "lucide-react"
import { FaStar } from "react-icons/fa"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { CommandDialog } from "@/components/ui/command"
import { FeedCustomizeDialog, type FeedPostPayload } from "@/components/home/feed-customize-dialog"
import {
  FeedLogDialog,
  type FeedLogDraft,
} from "@/components/home/feed-log-dialog"
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch, type SeriesSearchResult } from "@/hooks/use-media-search"
import {
  feedListHref,
  feedMediaHref,
  feedProfileHref,
  formatFeedRelativeTime,
  useFollowingFeed,
  type FollowingFeedItem,
  type FollowingStoryPerson,
} from "@/hooks/use-following-feed"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import type { Movie } from "@/lib/tmdb/client"
import { toLocalDateString } from "@/lib/watched-date"
import { cn } from "@/lib/utils"

const mediaFrameClass =
  "group/media relative mt-3 block overflow-hidden bg-zinc-950 " +
  "-mx-4 w-[calc(100%+2rem)] rounded-none border-y border-white/[0.06] " +
  "lg:mx-0 lg:w-full lg:rounded-2xl lg:border lg:border-white/[0.08]"

function displayName(user: { username: string; display_name?: string | null }) {
  return user.display_name?.trim() || user.username
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <div className="flex items-center gap-0.5 text-[#FF0048]">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={cn(
            "h-2.5 w-2.5",
            i < full ? "opacity-100" : i === full && half ? "opacity-60" : "opacity-20",
          )}
        />
      ))}
    </div>
  )
}

function FeedRowSkeleton() {
  return (
    <li className="border-b border-white/[0.06] py-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="-mx-4 mt-3 aspect-[16/9] w-[calc(100%+2rem)] rounded-none lg:mx-0 lg:w-full lg:rounded-2xl" />
    </li>
  )
}

function FullBleedMedia({
  href,
  imagePath,
  imageKind,
  title,
}: {
  href: string
  imagePath: string | null
  imageKind?: "poster" | "backdrop" | null
  title: string
}) {
  const isPoster = imageKind === "poster"
  const aspectClass = isPoster ? "aspect-[2/3] max-h-[70vh]" : "aspect-[16/9]"
  const size = isPoster ? "w780" : "w1280"

  if (!imagePath) {
    return (
      <Link href={href} className={mediaFrameClass}>
        <div
          className={cn(
            "flex w-full items-center justify-center bg-zinc-900 text-sm text-zinc-600",
            aspectClass,
          )}
        >
          {title}
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} className={mediaFrameClass}>
      <div className={cn("relative w-full overflow-hidden", aspectClass)}>
        <Image
          src={`https://image.tmdb.org/t/p/${size}${imagePath}`}
          alt={title}
          fill
          quality={90}
          className="object-cover transition duration-500 group-hover/media:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 720px"
        />
      </div>
    </Link>
  )
}

function collageTileClass(count: number, index: number) {
  if (count === 5) {
    return index < 2 ? "col-span-3" : "col-span-2"
  }
  return undefined
}

function WatchedMediaCarousel({
  href,
  images,
  filmTitle,
  layout = "slide",
}: {
  href: string
  images: { filePath: string; kind: "poster" | "backdrop" }[]
  filmTitle: string
  layout?: "slide" | "collage"
}) {
  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, Math.max(0, images.length - 1))
  const current = images[safeIndex]

  if (!current) {
    return <FullBleedMedia href={href} imagePath={null} title={filmTitle} />
  }

  if (images.length === 1) {
    return (
      <FullBleedMedia
        href={href}
        imagePath={current.filePath}
        imageKind={current.kind}
        title={filmTitle}
      />
    )
  }

  if (layout === "collage") {
    const n = images.length
    const gridClass =
      n <= 2
        ? "grid-cols-2"
        : n === 3
          ? "grid-cols-3"
          : n === 4
            ? "grid-cols-2"
            : n === 5
              ? "grid-cols-6"
              : "grid-cols-3"

    return (
      <Link href={href} className={mediaFrameClass}>
        <div className="relative aspect-[16/9] w-full">
          <div className={cn("absolute inset-0 grid gap-0.5 bg-black", gridClass)}>
            {images.map((img, i) => {
              const size = img.kind === "poster" ? "w780" : "w1280"
              return (
                <div
                  key={`${img.kind}-${img.filePath}`}
                  className={cn(
                    "relative min-h-0 min-w-0 overflow-hidden",
                    collageTileClass(n, i),
                  )}
                >
                  <Image
                    src={`https://image.tmdb.org/t/p/${size}${img.filePath}`}
                    alt=""
                    fill
                    quality={90}
                    className="object-cover transition duration-500 group-hover/media:scale-[1.04]"
                    sizes="(max-width: 1024px) 50vw, 360px"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </Link>
    )
  }

  const isPoster = current.kind === "poster"
  const size = isPoster ? "w780" : "w1280"

  return (
    <div className={mediaFrameClass}>
      <div
        className={cn(
          "relative w-full overflow-hidden",
          isPoster ? "aspect-[2/3] max-h-[70vh]" : "aspect-[16/9]",
        )}
      >
        <Link href={href} className="absolute inset-0 block">
          <Image
            src={`https://image.tmdb.org/t/p/${size}${current.filePath}`}
            alt={filmTitle}
            fill
            quality={90}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 720px"
          />
        </Link>
        <button
          type="button"
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault()
            setIndex((i) => (i - 1 + images.length) % images.length)
          }}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next photo"
          className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
          onClick={(e) => {
            e.preventDefault()
            setIndex((i) => (i + 1) % images.length)
          }}
        >
          <ChevronRight className="size-4" />
        </button>
        <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
          {images.map((img, i) => (
            <span
              key={`${img.kind}-${img.filePath}`}
              className={cn(
                "size-1.5 rounded-full",
                i === safeIndex ? "bg-white" : "bg-white/35",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ListFullBleed({
  href,
  posters,
  title,
  count,
}: {
  href: string
  posters: string[]
  title: string
  count: number
}) {
  const tiles = posters.slice(0, 6)
  if (tiles.length === 0) {
    return <FullBleedMedia href={href} imagePath={null} title={title} />
  }

  return (
    <Link href={href} className={mediaFrameClass}>
      <div className="relative aspect-[16/9] w-full">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
          {tiles.map((path, i) => (
            <div key={path + i} className="relative min-h-0 min-w-0 overflow-hidden">
              <Image
                src={`https://image.tmdb.org/t/p/w500${path}`}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover/media:scale-[1.04]"
                sizes="(max-width: 1024px) 33vw, 200px"
              />
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-4 lg:left-3 lg:right-3">
          <p className="truncate text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/70">
            {count === 1 ? "1 title" : `${count} titles`}
          </p>
        </div>
      </div>
    </Link>
  )
}

function StoriesStrip({
  selfUsername,
  selfAvatar,
  stories,
  onSelfClick,
}: {
  selfUsername?: string
  selfAvatar?: string | null
  stories: FollowingStoryPerson[]
  onSelfClick: () => void
}) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={onSelfClick}
        className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
      >
        <span className="relative flex size-[58px] items-center justify-center rounded-full bg-zinc-900 ring-2 ring-white/[0.12]">
          <Avatar className="size-[52px]">
            <AvatarImage src={avatarDisplaySrc(selfAvatar) ?? undefined} alt="" />
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
              {(selfUsername?.[0] || "Y").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#FF0048] text-white ring-2 ring-[#09090B]">
            <Plus className="size-3" strokeWidth={3} />
          </span>
        </span>
        <span className="w-full truncate text-center text-[10px] text-zinc-400">You</span>
      </button>

      {stories.map((u) => (
        <Link
          key={u.id}
          href={feedProfileHref(u.username)}
          className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={cn(
              "flex size-[58px] items-center justify-center rounded-full p-[2px]",
              u.hasNew
                ? "bg-gradient-to-br from-[#FF0048] via-[#ff4d7a] to-[#ff9eb0]"
                : "bg-white/[0.12]",
            )}
          >
            <Avatar className="size-full border-2 border-[#09090B]">
              <AvatarImage src={avatarDisplaySrc(u.avatar_url) ?? undefined} alt="" />
              <AvatarFallback className="bg-zinc-900 text-xs text-zinc-300">
                {displayName(u)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </span>
          <span className="w-full truncate text-center text-[10px] text-zinc-400">
            {u.username}
          </span>
        </Link>
      ))}
    </div>
  )
}

function Composer({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-zinc-950/60 px-3.5 py-3 text-left transition hover:border-white/[0.14] hover:bg-zinc-950"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FF0048]/15 text-[#FF0048]">
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1 text-sm text-zinc-500">
        Log something you watched…
      </span>
      <span className="shrink-0 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-400">
        Log
      </span>
    </button>
  )
}

function PostCard({ item }: { item: FollowingFeedItem }) {
  const [liked, setLiked] = useState(false)
  const profileHref = feedProfileHref(item.user.username)
  const name = displayName(item.user)
  const when = formatFeedRelativeTime(item.at)

  const href =
    item.kind === "list"
      ? feedListHref(item)
      : feedMediaHref(item.tmdbId, item.mediaType)

  const action =
    item.kind === "review"
      ? "reviewed"
      : item.kind === "list"
        ? "made a list"
        : item.rewatchCount > 0
          ? "rewatched"
          : "watched"

  const title = item.kind === "list" ? item.listTitle : item.title

  return (
    <article className="border-b border-white/[0.06] py-4 last:border-0">
      <div className="flex items-start gap-3">
        <Link href={profileHref} className="mt-0.5 shrink-0">
          <Avatar className="size-10 border border-white/[0.08]">
            <AvatarImage src={avatarDisplaySrc(item.user.avatar_url) ?? undefined} alt="" />
            <AvatarFallback className="bg-zinc-900 text-xs text-zinc-300">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13px] leading-snug">
            <Link href={profileHref} className="font-semibold text-zinc-100 hover:text-[#FF0048]">
              {name}
            </Link>
            <span className="text-zinc-600">@{item.user.username}</span>
            {when ? (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-600">{when}</span>
              </>
            ) : null}
          </header>

          <p className="mt-0.5 text-[13px] text-zinc-500">
            {action}{" "}
            <Link
              href={href}
              className="font-medium text-zinc-100 transition-colors hover:text-[#FF0048]"
            >
              {title}
            </Link>
            {item.kind === "watched" && item.rewatchCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-[#FF0048]/12 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#ff9eb0]">
                rewatch
              </span>
            ) : null}
          </p>

          {item.kind === "review" && item.rating != null && item.rating > 0 ? (
            <div className="mt-1.5">
              <Stars rating={item.rating} />
            </div>
          ) : null}
          {item.kind === "watched" ? null : null}
        </div>
      </div>

      {item.kind === "list" ? (
        <ListFullBleed
          href={href}
          posters={item.listPosters.length ? item.listPosters : item.posterPath ? [item.posterPath] : []}
          title={title}
          count={item.filmsCount}
        />
      ) : item.kind === "watched" ? (
        <WatchedMediaCarousel
          href={href}
          filmTitle={title}
          layout={item.feedLayout}
          images={
            item.feedImages.length > 0
              ? item.feedImages
              : item.feedImagePath
                ? [
                    {
                      filePath: item.feedImagePath,
                      kind: item.feedImageKind ?? "backdrop",
                    },
                  ]
                : item.posterPath
                  ? [{ filePath: item.posterPath, kind: "poster" as const }]
                  : []
          }
        />
      ) : (
        <FullBleedMedia
          href={href}
          imagePath={item.posterPath}
          imageKind="poster"
          title={title}
        />
      )}

      {item.kind === "watched" && item.feedTitle ? (
        <p className="mt-3 text-[15px] font-semibold leading-snug text-zinc-100">
          {item.feedTitle}
        </p>
      ) : null}
      {item.kind === "watched" && item.feedCaption ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-300">
          {item.feedCaption}
        </p>
      ) : null}

      {item.kind === "review" && item.review ? (
        <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-zinc-300">
          {item.review}
        </p>
      ) : null}

      <footer className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition",
            liked
              ? "text-[#FF0048]"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
          )}
          aria-label="Like"
        >
          <Heart className={cn("size-3.5", liked && "fill-[#FF0048]")} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => toast.message("Comments coming soon")}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
          aria-label="Comment"
        >
          <MessageCircle className="size-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}${href}`,
              )
              toast.success("Link copied")
            } catch {
              toast.message("Could not copy link")
            }
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
          aria-label="Share"
        >
          <Share className="size-3.5" strokeWidth={2} />
        </button>
      </footer>
    </article>
  )
}

type PendingLog = {
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  posterPath: string | null
  releaseDate: string | null
  isWatched: boolean
  watchedDate: string | null
  rewatchCount: number
}

export function SocialFeed({
  selfUsername,
  selfAvatar,
  limit = 12,
}: {
  selfUsername?: string
  selfAvatar?: string | null
  limit?: number
}) {
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const { items, stories, followingCount, loading, error, hasMore, loadMore, refresh } =
    useFollowingFeed(limit)

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const { filmResults, seriesResults, loading: searchLoading } = useMediaSearch(
    debouncedQuery,
    searchOpen,
  )

  const [logOpen, setLogOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [pending, setPending] = useState<PendingLog | null>(null)
  const [draft, setDraft] = useState<FeedLogDraft | null>(null)
  const [logging, setLogging] = useState(false)

  const openComposer = useCallback(() => {
    setQuery("")
    setSearchOpen(true)
  }, [])

  const prepareLog = useCallback(
    async (payload: {
      tmdbId: number
      mediaType: "movie" | "tv"
      title: string
      posterPath: string | null
      releaseDate: string | null
    }) => {
      if (!authUser?.id) {
        toast.error("Sign in to log titles")
        return
      }

      setSearchOpen(false)

      const { data } = await supabase
        .from("items_interactions")
        .select("is_watched, watched_date, rewatch_count")
        .eq("user_id", authUser.id)
        .eq("tmdb_id", payload.tmdbId)
        .eq("media_type", payload.mediaType)
        .maybeSingle()

      setPending({
        ...payload,
        isWatched: Boolean(data?.is_watched),
        watchedDate: (data?.watched_date as string | null) ?? null,
        rewatchCount: (data?.rewatch_count as number) ?? 0,
      })
      setDraft(null)
      setCustomizeOpen(false)
      setLogOpen(true)
    },
    [authUser?.id, supabase],
  )

  const onSelectFilm = useCallback(
    (movie: Movie) => {
      void prepareLog({
        tmdbId: movie.id,
        mediaType: "movie",
        title: movie.title || "Untitled",
        posterPath: movie.poster_path,
        releaseDate: movie.release_date ?? null,
      })
    },
    [prepareLog],
  )

  const onSelectSeries = useCallback(
    (series: SeriesSearchResult) => {
      void prepareLog({
        tmdbId: series.id,
        mediaType: "tv",
        title: series.name || "Untitled",
        posterPath: series.poster_path ?? null,
        releaseDate: series.first_air_date ?? null,
      })
    },
    [prepareLog],
  )

  const upsertWatch = useCallback(
    async (
      logDraft: FeedLogDraft,
      feed?: FeedPostPayload | null,
    ) => {
      if (!authUser?.id || !pending) return
      const share = Boolean(feed?.images.length)
      setLogging(true)
      try {
        const nextRewatch = logDraft.isRewatch
          ? pending.rewatchCount + 1
          : pending.isWatched
            ? pending.rewatchCount
            : 0

        const primary = feed?.images[0]

        const { error: upsertError } = await supabase.from("items_interactions").upsert(
          {
            user_id: authUser.id,
            tmdb_id: pending.tmdbId,
            media_type: pending.mediaType,
            is_watched: true,
            watched_date: logDraft.watchedDate,
            rewatch_count: nextRewatch,
            poster_path: pending.posterPath,
            movie_title: pending.title,
            release_date: pending.releaseDate,
            in_watchlist: false,
            feed_shared: share,
            feed_visibility: share ? logDraft.visibility : "friends",
            feed_image_path: share && primary ? primary.filePath : null,
            feed_image_kind: share && primary ? primary.kind : null,
            feed_images: share
              ? feed!.images.map((img) => ({
                  filePath: img.filePath,
                  kind: img.kind,
                }))
              : [],
            feed_title: share ? feed!.title || null : null,
            feed_caption: share ? feed!.caption || null : null,
            feed_layout: share ? feed!.layout : "slide",
            feed_shared_at: share ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tmdb_id,media_type" },
        )

        if (upsertError) throw upsertError
        toast.success(
          share
            ? "Posted to feed"
            : logDraft.isRewatch
              ? "Rewatch logged"
              : "Logged as watched",
        )
        setPending(null)
        setDraft(null)
        setLogOpen(false)
        setCustomizeOpen(false)
        await refresh()
      } catch (e) {
        console.error(e)
        toast.error(share ? "Could not post to feed" : "Could not save watch log")
        throw e
      } finally {
        setLogging(false)
      }
    },
    [authUser?.id, pending, refresh, supabase],
  )

  const handleSaveOnly = useCallback(
    async (logDraft: FeedLogDraft) => {
      await upsertWatch(logDraft, null)
    },
    [upsertWatch],
  )

  const handleNextToCustomize = useCallback((logDraft: FeedLogDraft) => {
    setDraft(logDraft)
    setLogOpen(false)
    setCustomizeOpen(true)
  }, [])

  const handleBackFromCustomize = useCallback(() => {
    setCustomizeOpen(false)
    setLogOpen(true)
  }, [])

  const handlePostToFeed = useCallback(
    async (payload: FeedPostPayload) => {
      if (!draft) return
      await upsertWatch(draft, payload)
    },
    [draft, upsertWatch],
  )

  const emptyNode = useMemo(() => {
    if (followingCount === 0) {
      return (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-zinc-950/30 px-4 py-8 text-center">
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
            Follow people to fill this feed with watches, reviews, and lists.
            Shared watches only show when someone opts in.
          </p>
          <Link
            href="/lists"
            className="mt-4 inline-flex text-sm font-medium text-[#ff9eb0] transition hover:text-[#FF0048]"
          >
            Browse public lists →
          </Link>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-dashed border-white/[0.08] bg-zinc-950/30 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">
          Quiet for now — nothing new from people you follow.
        </p>
        <button
          type="button"
          onClick={openComposer}
          className="mt-4 inline-flex text-sm font-medium text-[#ff9eb0] transition hover:text-[#FF0048]"
        >
          Log something yourself →
        </button>
      </div>
    )
  }, [followingCount, openComposer])

  return (
    <div className="space-y-4">
      <StoriesStrip
        selfUsername={selfUsername}
        selfAvatar={selfAvatar}
        stories={stories}
        onSelfClick={openComposer}
      />
      <Composer onClick={openComposer} />

      {loading ? (
        <ul>
          {Array.from({ length: 4 }).map((_, i) => (
            <FeedRowSkeleton key={i} />
          ))}
        </ul>
      ) : error ? (
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950/40 px-4 py-6 text-center">
          <p className="text-sm text-zinc-500">Could not load your feed.</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 text-sm text-[#ff9eb0] hover:text-[#FF0048]"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        emptyNode
      ) : (
        <>
          <ul>
            {items.map((item) => (
              <PostCard key={item.id} item={item} />
            ))}
          </ul>
          {hasMore ? (
            <button
              type="button"
              onClick={loadMore}
              className="w-full rounded-xl border border-white/[0.08] py-2.5 text-sm text-zinc-500 transition hover:border-white/[0.14] hover:text-zinc-300"
            >
              Load more
            </button>
          ) : null}
        </>
      )}

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <MediaSearchCommandContent
          query={query}
          onQueryChange={setQuery}
          filmResults={filmResults}
          seriesResults={seriesResults}
          loading={searchLoading}
          onSelectFilm={onSelectFilm}
          onSelectSeries={onSelectSeries}
          inputPlaceholder="Search a film or series to log…"
          filmRowMode="pick"
          seriesRowMode="pick"
        />
      </CommandDialog>

      <FeedLogDialog
        open={logOpen}
        onOpenChange={(open) => {
          setLogOpen(open)
          if (!open && !customizeOpen) {
            setPending(null)
            setDraft(null)
          }
        }}
        title={pending?.title}
        isWatched={pending?.isWatched ?? false}
        watchedDate={pending?.watchedDate ?? toLocalDateString()}
        rewatchCount={pending?.rewatchCount ?? 0}
        loading={logging}
        initialDraft={draft}
        onSaveOnly={handleSaveOnly}
        onNextToCustomize={handleNextToCustomize}
      />

      {pending && draft ? (
        <FeedCustomizeDialog
          open={customizeOpen}
          onOpenChange={(open) => {
            setCustomizeOpen(open)
            if (!open && !logOpen) {
              setPending(null)
              setDraft(null)
            }
          }}
          filmTitle={pending.title}
          tmdbId={pending.tmdbId}
          mediaType={pending.mediaType}
          visibility={draft.visibility}
          selfName={selfUsername}
          selfUsername={selfUsername}
          selfAvatar={selfAvatar}
          loading={logging}
          onBack={handleBackFromCustomize}
          onPost={handlePostToFeed}
        />
      ) : null}
    </div>
  )
}
