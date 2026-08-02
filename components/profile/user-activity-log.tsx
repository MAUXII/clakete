"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import {
  Eye,
  Heart,
  List,
  Bookmark,
  MessageSquareText,
  Share2,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { RatingStars } from "@/components/movies/star-rating"
import {
  activityDayKey,
  activityVerb,
  formatActivityDay,
  formatActivityRange,
  formatActivityTime,
  mediaHref,
  sortActivityEvents,
  type ActivityEvent,
  type ActivityKind,
} from "@/lib/activity-log"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"

const KIND_ICON: Record<ActivityKind, typeof Eye> = {
  joined: Sparkles,
  watched: Eye,
  reviewed: MessageSquareText,
  rated: Star,
  liked: Heart,
  watchlist: Bookmark,
  list_created: List,
  list_item: List,
  followed: UserPlus,
  shared: Share2,
}

type InteractionRow = {
  id: number
  tmdb_id: number
  media_type: string | null
  movie_title: string | null
  poster_path: string | null
  is_watched: boolean
  is_liked: boolean
  in_watchlist: boolean
  watched_date: string | null
  rewatch_count: number | null
  rating: number | null
  review: string | null
  feed_shared: boolean
  feed_shared_at: string | null
  created_at: string
  updated_at: string
}

export function UserActivityLog({
  userId,
  username,
  isOwnProfile = false,
}: {
  userId: string
  username: string
  isOwnProfile?: boolean
}) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [joinedAt, setJoinedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(80)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userRes, interactionsRes, listsRes, followsRes] = await Promise.all([
        supabase
          .from("users")
          .select("created_at")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("items_interactions")
          .select(
            "id, tmdb_id, media_type, movie_title, poster_path, is_watched, is_liked, in_watchlist, watched_date, rewatch_count, rating, review, feed_shared, feed_shared_at, created_at, updated_at",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(400),
        supabase
          .from("lists")
          .select("id, title, slug, created_at, is_public")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(80),
        supabase
          .from("user_followers")
          .select("user_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
          .limit(100),
      ])

      const lists = listsRes.data ?? []
      const listIds = lists
        .filter((l) => isOwnProfile || l.is_public !== false)
        .map((l) => l.id as string)

      let listItems: Array<{
        id: number
        list_id: string
        tmdb_id: number
        title: string
        poster_path: string | null
        media_type: string | null
        added_at: string
      }> = []

      if (listIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("list_items")
          .select("id, list_id, tmdb_id, title, poster_path, media_type, added_at")
          .in("list_id", listIds)
          .order("added_at", { ascending: false })
          .limit(120)
        listItems = (itemsData ?? []) as typeof listItems
      }

      const joined = (userRes.data?.created_at as string | undefined) ?? null
      setJoinedAt(joined)

      const interactions = (interactionsRes.data ?? []) as InteractionRow[]

      // Rows marked via MovieCard used to save poster without title — backfill from TMDB
      const missingTitle = interactions.filter((r) => !r.movie_title?.trim())
      if (missingTitle.length > 0) {
        const seen = new Set<string>()
        const toResolve: InteractionRow[] = []
        for (const row of missingTitle) {
          const key = `${row.media_type ?? "movie"}:${row.tmdb_id}`
          if (seen.has(key)) continue
          seen.add(key)
          toResolve.push(row)
        }

        const titleByKey = new Map<string, string>()
        await Promise.all(
          toResolve.slice(0, 40).map(async (row) => {
            const isTv = row.media_type === "tv"
            try {
              const res = await fetch(
                isTv ? `/api/series/${row.tmdb_id}` : `/api/movies/${row.tmdb_id}`,
              )
              if (!res.ok) return
              const data = await res.json()
              const resolved =
                (typeof data?.title === "string" && data.title) ||
                (typeof data?.name === "string" && data.name) ||
                null
              if (resolved) {
                titleByKey.set(`${row.media_type ?? "movie"}:${row.tmdb_id}`, resolved)
              }
            } catch {
              // ignore individual failures
            }
          }),
        )

        const patchIds: Array<{ id: number; title: string }> = []
        for (const row of interactions) {
          if (row.movie_title?.trim()) continue
          const resolved = titleByKey.get(`${row.media_type ?? "movie"}:${row.tmdb_id}`)
          if (!resolved) continue
          row.movie_title = resolved
          patchIds.push({ id: row.id, title: resolved })
        }

        if (isOwnProfile && patchIds.length > 0) {
          await Promise.all(
            patchIds.map(({ id, title }) =>
              supabase
                .from("items_interactions")
                .update({ movie_title: title })
                .eq("id", id)
                .eq("user_id", userId),
            ),
          )
        }
      }

      const collected: ActivityEvent[] = []

      if (joined) {
        collected.push({
          id: `joined-${userId}`,
          kind: "joined",
          at: joined,
          title: `@${username}`,
          href: `/${username}`,
          subtitle: "Started tracking films on Clakete",
        })
      }

      for (const row of interactions) {
        const title = row.movie_title?.trim() || "Untitled"
        const href = mediaHref(row.tmdb_id, row.media_type, row.movie_title)
        const poster = row.poster_path

        if (row.is_watched) {
          const at = row.watched_date || row.updated_at || row.created_at
          collected.push({
            id: `watched-${row.id}`,
            kind: "watched",
            at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
            rewatchCount: row.rewatch_count ?? 0,
            rating: row.rating && row.rating > 0 ? row.rating : null,
          })
        }

        if (row.review && row.review.trim()) {
          collected.push({
            id: `reviewed-${row.id}`,
            kind: "reviewed",
            at: row.updated_at || row.created_at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
            rating: row.rating && row.rating > 0 ? row.rating : null,
            subtitle:
              row.review.length > 120
                ? `${row.review.slice(0, 120).trim()}…`
                : row.review,
          })
        } else if (row.rating != null && row.rating > 0 && !row.is_watched) {
          collected.push({
            id: `rated-${row.id}`,
            kind: "rated",
            at: row.updated_at || row.created_at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
            rating: row.rating,
          })
        }

        if (row.is_liked) {
          collected.push({
            id: `liked-${row.id}`,
            kind: "liked",
            at: row.updated_at || row.created_at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
          })
        }

        if (row.in_watchlist) {
          collected.push({
            id: `watchlist-${row.id}`,
            kind: "watchlist",
            at: row.updated_at || row.created_at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
          })
        }

        if (row.feed_shared && row.feed_shared_at) {
          collected.push({
            id: `shared-${row.id}`,
            kind: "shared",
            at: row.feed_shared_at,
            title,
            href,
            posterPath: poster,
            mediaType: row.media_type,
            tmdbId: row.tmdb_id,
          })
        }
      }

      const listById = new Map(lists.map((l) => [l.id as string, l]))

      for (const list of lists) {
        if (!isOwnProfile && list.is_public === false) continue
        collected.push({
          id: `list-${list.id}`,
          kind: "list_created",
          at: list.created_at,
          title: list.title || "Untitled list",
          href: list.slug
            ? `/${username}/list/${list.slug}`
            : `/${username}/lists`,
        })
      }

      for (const item of listItems) {
        const list = listById.get(item.list_id)
        if (!list) continue
        if (!isOwnProfile && list.is_public === false) continue

        collected.push({
          id: `list-item-${item.id}`,
          kind: "list_item",
          at: item.added_at,
          title: item.title || "Untitled",
          href: mediaHref(item.tmdb_id, item.media_type, item.title),
          posterPath: item.poster_path,
          mediaType: item.media_type,
          subtitle: list.title ? `in ${list.title}` : null,
        })
      }

      const followIds = (followsRes.data ?? []).map((f) => f.user_id as string)
      if (followIds.length > 0) {
        const { data: followUsers } = await supabase
          .from("users")
          .select("id, username, display_name")
          .in("id", followIds)

        const byId = new Map(
          (followUsers ?? []).map((u) => [u.id as string, u]),
        )

        for (const f of followsRes.data ?? []) {
          const u = byId.get(f.user_id as string)
          if (!u?.username) continue
          collected.push({
            id: `follow-${f.user_id}-${f.created_at}`,
            kind: "followed",
            at: f.created_at as string,
            title: u.display_name || `@${u.username}`,
            href: `/${u.username}`,
            subtitle: `@${u.username}`,
          })
        }
      }

      setEvents(sortActivityEvents(collected))
      setVisible(80)
    } catch (e) {
      console.error("[activity-log]", e)
      toast.error(t("profile.loadActivityError"))
    } finally {
      setLoading(false)
    }
  }, [supabase, userId, username, isOwnProfile])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo(() => {
    const slice = events.slice(0, visible)
    const map = new Map<string, ActivityEvent[]>()
    for (const ev of slice) {
      const key = activityDayKey(ev.at)
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [events, visible])

  const rangeLabel = useMemo(() => {
    if (events.length === 0) return null
    const newest = events[0]?.at ?? null
    const oldest = events[events.length - 1]?.at ?? joinedAt
    return formatActivityRange(oldest, newest)
  }, [events, joinedAt])

  if (loading) {
    return (
      <div className="mt-4 space-y-4">
        <HeaderSkeleton />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md bg-white/[0.04]" />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground/50">
          {t("profile.activity")}
        </h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        <p className="text-sm text-muted-foreground">{t("profile.activityEmpty")}</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground/50">
            {t("profile.activity")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("profile.activityFullTrack", {
              count: events.length,
              entries: events.length === 1 ? t("profile.entry") : t("profile.entries"),
            })}
            {rangeLabel ? ` · ${rangeLabel}` : null}
          </p>
        </div>
      </div>
      <div className="mb-5 mt-2 h-[0.3px] w-full bg-muted-foreground/10" />

      <div className="relative">
        <div
          aria-hidden
          className="absolute bottom-2 left-[19px] top-2 w-px bg-gradient-to-b from-brand/50 via-white/[0.08] to-transparent"
        />

        <ol className="space-y-6">
          {groups.map(([day, dayEvents]) => (
            <li key={day}>
              <div className="mb-3 flex items-center gap-3 pl-12">
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {formatActivityDay(day)}
                </span>
                <div className="h-px flex-1 bg-white/[0.05]" />
              </div>

              <ul className="space-y-1">
                {dayEvents.map((ev) => (
                  <ActivityRow key={ev.id} event={ev} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {visible < events.length ? (
        <button
          type="button"
          onClick={() => setVisible((v) => Math.min(v + 80, events.length))}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-md border border-border bg-brand/10 text-sm text-brand transition hover:bg-brand/20"
        >
          Load earlier · {events.length - visible} remaining
        </button>
      ) : null}
    </div>
  )
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const Icon = KIND_ICON[event.kind]
  const verb = activityVerb(event.kind, event.rewatchCount)
  const time = formatActivityTime(event.at)
  const inner = (
    <div className="group flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/40">
      <div className="relative z-10 flex w-10 shrink-0 justify-center pt-1">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full border border-border bg-[#0c0c0e] text-muted-foreground",
            event.kind === "joined" && "border-brand/30 text-brand",
            event.kind === "watched" && "text-brand-light",
            event.kind === "liked" && "text-brand",
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] leading-snug text-muted-foreground">
            <span className="text-muted-foreground">{verb}</span>{" "}
            <span className="font-medium text-foreground group-hover:text-brand-light">
              {event.title}
            </span>
            {event.kind === "watched" &&
            event.rewatchCount &&
            event.rewatchCount > 0 ? (
              <span className="text-muted-foreground">
                {" "}
                · {event.rewatchCount}{" "}
                {event.rewatchCount === 1 ? "rewatch" : "rewatches"}
              </span>
            ) : null}
          </p>
          {time ? (
            <time className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
              {time}
            </time>
          ) : null}
        </div>

        {event.rating != null && event.rating > 0 ? (
          <div className="mt-0.5">
            <RatingStars
              value={event.rating}
              starClassName="size-2.5"
              emptyClassName="text-muted-foreground"
            />
          </div>
        ) : null}

        {event.subtitle ? (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {event.subtitle}
          </p>
        ) : null}
      </div>

      {event.posterPath ? (
        <div className="relative mt-0.5 hidden h-14 w-9 shrink-0 overflow-hidden rounded-[3px] border border-border sm:block">
          <Image
            src={`https://image.tmdb.org/t/p/w92${event.posterPath}`}
            alt=""
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>
      ) : null}
    </div>
  )

  if (event.href) {
    return (
      <li>
        <Link href={event.href} className="block">
          {inner}
        </Link>
      </li>
    )
  }

  return <li>{inner}</li>
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 bg-white/[0.06]" />
      <Skeleton className="h-3 w-48 bg-white/[0.04]" />
    </div>
  )
}
