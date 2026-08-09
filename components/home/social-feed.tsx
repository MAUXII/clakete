"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { CommandDialog } from "@/components/ui/command"
import { FeedCustomizeDialog, type FeedPostPayload } from "@/components/home/feed-customize-dialog"
import { FeedWatchedPostCard } from "@/components/home/feed-post-card"
import {
  FeedListPostCard,
  FeedReviewPostCard,
} from "@/components/home/feed-review-list-cards"
import { FeedLogDialog, type FeedLogDraft } from "@/components/home/feed-log-dialog"
import {
  WatchedMediaCarousel,
  watchedItemImages,
} from "@/components/home/feed-watched-media"
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch, type SeriesSearchResult } from "@/hooks/use-media-search"
import {
  feedMediaHref,
  mapWatchedRow,
  useFollowingFeed,
  WATCHED_FEED_SELECT,
  type FollowingFeedItem,
  type WatchedFeedRow,
} from "@/hooks/use-following-feed"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import type { Movie } from "@/lib/tmdb/client"
import { toLocalDateString } from "@/lib/watched-date"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/providers/i18n-provider"

function FeedRowSkeleton() {
  return (
    <li className="border-b border-border/80 py-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 aspect-[16/9] w-full max-h-56 rounded-2xl" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      </div>
    </li>
  )
}

/** Suspense / SSR-safe placeholder while SocialFeed hydrates. */
export function SocialFeedSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-16 w-full rounded-none" />
      <ul>
        {Array.from({ length: rows }).map((_, i) => (
          <FeedRowSkeleton key={i} />
        ))}
      </ul>
    </div>
  )
}

function Composer({
  onClick,
  avatarUrl,
  username,
}: {
  onClick: () => void
  avatarUrl?: string | null
  username?: string
}) {
  const { t } = useT()
  const initial = (username?.[0] || "?").toUpperCase()

  return (
    <div className="-mx-3 border-b border-border/70 sm:-mx-4">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-muted/20 sm:px-4"
      >
        <Avatar className="size-10 shrink-0 border border-border">
          <AvatarImage src={avatarDisplaySrc(avatarUrl) ?? undefined} alt="" />
          <AvatarFallback className="bg-muted text-sm text-muted-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>

        <p className="min-w-0 flex-1 text-[15px] leading-snug text-muted-foreground/70">
          {t("home.composerPlaceholder")}
        </p>

        <span
          aria-disabled="true"
          className="inline-flex h-8 shrink-0 cursor-default items-center justify-center rounded-full bg-brand/35 px-4 text-[13px] font-bold text-white/90 opacity-60"
        >
          {t("home.composerCta")}
        </span>
      </button>
    </div>
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
  const { t } = useT()
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locateShareUid = searchParams.get("p")?.trim() || null
  const { items, followingCount, loading, error, hasMore, loadMore, refresh } =
    useFollowingFeed(limit)
  const [loadingMore, setLoadingMore] = useState(false)

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
  const [highlightUid, setHighlightUid] = useState<string | null>(null)
  const [pinnedItem, setPinnedItem] = useState<FollowingFeedItem | null>(null)
  const locateDone = useRef(false)

  useEffect(() => {
    if (!locateShareUid) return
    locateDone.current = false
    setPinnedItem(null)
  }, [locateShareUid])

  const feedItems = useMemo(() => {
    if (!pinnedItem) return items
    const rest = items.filter((i) => i.id !== pinnedItem.id)
    return [pinnedItem, ...rest]
  }, [items, pinnedItem])

  useEffect(() => {
    if (!locateShareUid) return
    if (loading || locateDone.current) return

    const run = async () => {
      const inFeed = items.find(
        (i) =>
          (i.kind === "watched" || i.kind === "review") &&
          i.shareUid === locateShareUid,
      )

      if (inFeed) {
        setPinnedItem(inFeed)
      } else if (authUser?.id) {
        try {
          const { data: row } = await supabase
            .from("items_interactions")
            .select(WATCHED_FEED_SELECT)
            .eq("feed_share_uid", locateShareUid)
            .eq("feed_shared", true)
            .maybeSingle()

          if (row) {
            const watched = row as WatchedFeedRow
            const { data: author } = await supabase
              .from("users")
              .select("id, username, display_name, avatar_url")
              .eq("id", watched.user_id)
              .maybeSingle()

            if (author?.username) {
              const interactionId = watched.id as number
              const [likesRes, commentsRes] = await Promise.all([
                supabase
                  .from("feed_post_likes")
                  .select("user_id")
                  .eq("interaction_id", interactionId),
                supabase
                  .from("feed_post_comments")
                  .select("id")
                  .eq("interaction_id", interactionId),
              ])
              const likeCount = likesRes.data?.length ?? 0
              const likedByMe = Boolean(
                likesRes.data?.some((r) => r.user_id === authUser.id),
              )
              const commentCount = commentsRes.data?.length ?? 0
              setPinnedItem(
                mapWatchedRow(
                  watched,
                  {
                    id: author.id,
                    username: author.username,
                    display_name: author.display_name,
                    avatar_url: author.avatar_url,
                  },
                  { likeCount, likedByMe, commentCount },
                ),
              )
            }
          }
        } catch (e) {
          console.error("[feed-locate]", e)
        }
      }

      locateDone.current = true
      setHighlightUid(locateShareUid)
      router.replace("/", { scroll: false })

      window.setTimeout(() => {
        const el = document.querySelector(
          `[data-feed-share="${CSS.escape(locateShareUid)}"]`,
        )
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 80)

      window.setTimeout(() => setHighlightUid(null), 2600)
    }

    void run()
  }, [authUser?.id, items, loading, locateShareUid, router, supabase])

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
        <div className="rounded-xl border border-dashed border-border bg-background/70 px-4 py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("home.feedEmptyNoFollowsTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("home.feedEmptyNoFollowsBody")}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href="/lists">{t("home.feedEmptyNoFollowsCta")}</Link>
          </Button>
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-dashed border-border bg-background/70 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">
          {t("home.feedEmptyQuietTitle")}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t("home.feedEmptyQuietBody")}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={openComposer}
        >
          {t("home.feedEmptyQuietCta")}
        </Button>
      </div>
    )
  }, [followingCount, openComposer, t])

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const requestLoadMore = useCallback(() => {
    if (!hasMore || loading || loadingMore) return
    setLoadingMore(true)
    loadMore()
    window.setTimeout(() => setLoadingMore(false), 120)
  }, [hasMore, loading, loadingMore, loadMore])

  useEffect(() => {
    if (!hasMore || loading) return
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          requestLoadMore()
        }
      },
      { rootMargin: "240px 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, requestLoadMore, items.length])

  const initialLoading = loading && items.length === 0

  return (
    <div className="space-y-3">
      <Composer
        onClick={openComposer}
        avatarUrl={selfAvatar}
        username={selfUsername}
      />

      {initialLoading ? (
        <ul>
          {Array.from({ length: 4 }).map((_, i) => (
            <FeedRowSkeleton key={i} />
          ))}
        </ul>
      ) : error ? (
        <div className="rounded-xl border border-border/80 bg-muted/40 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">{t("home.feedLoadError")}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 text-sm text-brand-light hover:text-brand"
          >
            {t("home.feedTryAgain")}
          </button>
        </div>
      ) : feedItems.length === 0 ? (
        emptyNode
      ) : (
        <>
          <ul>
            {feedItems.map((item) =>
              item.kind === "watched" ? (
                <FeedWatchedPostCard
                  key={item.id}
                  item={item}
                  highlighted={
                    Boolean(item.shareUid && highlightUid === item.shareUid)
                  }
                  onRemoved={() => void refresh()}
                  onUpdated={() => void refresh()}
                  media={
                    <WatchedMediaCarousel
                      href={feedMediaHref(item.tmdbId, item.mediaType, item.title)}
                      filmTitle={item.title}
                      layout={item.feedLayout}
                      images={watchedItemImages(item)}
                    />
                  }
                />
              ) : item.kind === "review" ? (
                <FeedReviewPostCard
                  key={item.id}
                  item={item}
                  highlighted={
                    Boolean(item.shareUid && highlightUid === item.shareUid)
                  }
                  onRemoved={() => void refresh()}
                />
              ) : item.kind === "list" ? (
                <FeedListPostCard
                  key={item.id}
                  item={item}
                  onRemoved={() => void refresh()}
                />
              ) : null,
            )}
          </ul>
          {hasMore ? (
            <div
              ref={loadMoreRef}
              className="flex min-h-10 items-center justify-center py-4 text-xs text-muted-foreground"
              aria-busy={loadingMore}
            >
              {loadingMore ? t("home.feedLoadMore") : null}
            </div>
          ) : (
            <p className="py-3 text-center text-[11px] text-muted-foreground">
              {t("home.feedCaughtUp")}
            </p>
          )}
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
