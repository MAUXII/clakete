"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRive } from "@rive-app/react-canvas"
import {
  CalendarDays,
  Download,
  Heart,
  LayoutGrid,
  Pencil,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { MovieCard } from "@/components/movies/movie-card"
import { SeriesCard } from "@/components/series/series-card"
import {
  EditWatchLogDialog,
  type EditWatchLogPayload,
} from "@/components/profile/edit-watch-log-dialog"
import { ImportLetterboxdDialog } from "@/components/profile/import-letterboxd-dialog"
import {
  WatchedCalendar,
  type CalendarWatchItem,
} from "@/components/profile/watched-calendar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  buildLetterboxdDiaryCsv,
  diaryMonthKey,
  diaryYear,
  downloadTextFile,
} from "@/lib/diary"
import { filmHref, seriesHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"
import {
  formatRewatchLabel,
  formatWatchedDate,
  toLocalDateString,
} from "@/lib/watched-date"

type WatchedItem = {
  id: number
  tmdb_id: number
  poster_path: string | null
  movie_title: string | null
  release_date: string | null
  media_type: string | null
  created_at: string
  watched_date: string | null
  rewatch_count: number | null
  rating: number | null
  is_liked: boolean | null
}

type ViewMode = "grid" | "calendar"

const MONTH_OPTIONS = [
  { value: "all", label: "All months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const

export function WatchedDiary({
  userId,
  username,
  isOwnProfile,
}: {
  userId: string
  username: string
  isOwnProfile: boolean
}) {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [items, setItems] = useState<WatchedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>("grid")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("all")
  const [likedOnly, setLikedOnly] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [editing, setEditing] = useState<WatchedItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [daySheet, setDaySheet] = useState<{
    date: string
    items: CalendarWatchItem[]
  } | null>(null)

  const setYear = (value: string) => {
    setYearFilter(value)
    if (value === "all") setMonthFilter("all")
  }

  const { RiveComponent } = useRive({
    src: "/cat1.riv",
    artboard: "Artboard",
    stateMachines: ["State Machine 1"],
    autoplay: true,
  })

  const fetchWatched = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("items_interactions")
        .select(
          "id, tmdb_id, poster_path, movie_title, release_date, media_type, created_at, watched_date, rewatch_count, rating, is_liked",
        )
        .eq("user_id", userId)
        .eq("is_watched", true)
        .order("watched_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error(error)
        toast.error("Could not load watched titles")
        return
      }

      setItems((data as WatchedItem[]) ?? [])
    } catch (err) {
      console.error(err)
      toast.error("Could not load watched titles")
    } finally {
      setLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    setLoading(true)
    void fetchWatched()
  }, [fetchWatched])

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const item of items) {
      const y = diaryYear(item.watched_date)
      if (y != null) set.add(y)
    }
    return Array.from(set).sort((a, b) => b - a)
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (likedOnly && !item.is_liked) return false
      const key = diaryMonthKey(item.watched_date)
      if (!key) {
        // Undated: only show when no year/month filter
        return yearFilter === "all" && monthFilter === "all"
      }
      const [y, m] = key.split("-")
      if (yearFilter !== "all" && y !== yearFilter) return false
      if (monthFilter !== "all" && m !== monthFilter) return false
      return true
    })
  }, [items, yearFilter, monthFilter, likedOnly])

  const calendarItems = useMemo((): CalendarWatchItem[] => {
    const source = likedOnly ? items.filter((i) => i.is_liked) : items
    return source.map((item) => ({
      id: item.id,
      tmdb_id: item.tmdb_id,
      poster_path: item.poster_path,
      movie_title: item.movie_title,
      release_date: item.release_date,
      media_type: item.media_type,
      watched_date: item.watched_date,
    }))
  }, [items, likedOnly])

  const diaryItemHref = (item: {
    tmdb_id: number
    media_type: string | null
    movie_title?: string | null
    release_date?: string | null
  }) =>
    item.media_type === "tv"
      ? seriesHref({ id: item.tmdb_id, name: item.movie_title })
      : filmHref({
          id: item.tmdb_id,
          title: item.movie_title,
          release_date: item.release_date,
        })

  // Sync calendar month when year/month filters change
  useEffect(() => {
    if (yearFilter !== "all") {
      setCalYear(Number(yearFilter))
    }
    if (monthFilter !== "all") {
      setCalMonth(Number(monthFilter) - 1)
    }
  }, [yearFilter, monthFilter])

  const handleExport = () => {
    const rows = (yearFilter === "all" && monthFilter === "all"
      ? items
      : filtered
    ).map((item) => ({
      title: item.movie_title || "Untitled",
      releaseDate: item.release_date,
      watchedDate: item.watched_date,
      createdAt: item.created_at,
      rating: item.rating,
      rewatchCount: item.rewatch_count ?? 0,
      mediaType: item.media_type,
      tmdbId: item.tmdb_id,
    }))

    if (rows.length === 0) {
      toast.message("Nothing to export")
      return
    }

    const csv = buildLetterboxdDiaryCsv(rows)
    const stamp = toLocalDateString()
    const suffix =
      yearFilter !== "all"
        ? monthFilter !== "all"
          ? `-${yearFilter}-${monthFilter}`
          : `-${yearFilter}`
        : ""
    downloadTextFile(`clakete-diary-${username}${suffix}-${stamp}.csv`, csv)
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? "entry" : "entries"}`)
  }

  const handleSaveEdit = async (payload: EditWatchLogPayload) => {
    if (!editing) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("items_interactions")
        .update({
          watched_date: payload.watchedDate,
          rewatch_count: payload.rewatchCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id)
        .eq("user_id", userId)

      if (error) throw error

      setItems((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                watched_date: payload.watchedDate,
                rewatch_count: payload.rewatchCount,
              }
            : item,
        ),
      )
      toast.success("Watch log updated")
    } catch (e) {
      console.error(e)
      toast.error("Could not update watch log")
      throw e
    } finally {
      setSaving(false)
    }
  }

  const handleUnwatch = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from("items_interactions")
        .update({
          is_watched: false,
          watched_date: null,
          rewatch_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id)
        .eq("user_id", userId)

      if (error) throw error

      setItems((prev) => prev.filter((item) => item.id !== editing.id))
      toast.success("Removed from watched")
    } catch (e) {
      console.error(e)
      toast.error("Could not remove watched")
      throw e
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (item: WatchedItem) => {
    setEditing(item)
  }

  const posterEditAction = (item: WatchedItem) =>
    isOwnProfile ? (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openEdit(item)
        }}
        className="rounded-md border border-transparent bg-secondary p-2 text-white transition-colors hover:border-brand/20 hover:bg-[#280F16] hover:text-brand"
        aria-label={`Edit ${item.movie_title || "watch log"}`}
        title="Edit watch log"
      >
        <Pencil className="h-4 w-4" />
      </button>
    ) : null

  const toolbar = (
    <div className="mb-4 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex shrink-0 items-center rounded-md border border-white/[0.08] p-0.5">
        <button
          type="button"
          onClick={() => setView("grid")}
          className={cn(
            "inline-flex items-center gap-1 rounded-[5px] px-2 py-1.5 text-xs transition",
            view === "grid"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          aria-pressed={view === "grid"}
          title="Grid"
        >
          <LayoutGrid className="size-3.5" />
          <span className="hidden sm:inline">Grid</span>
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={cn(
            "inline-flex items-center gap-1 rounded-[5px] px-2 py-1.5 text-xs transition",
            view === "calendar"
              ? "bg-white/[0.08] text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          aria-pressed={view === "calendar"}
          title="Calendar"
        >
          <CalendarDays className="size-3.5" />
          <span className="hidden sm:inline">Calendar</span>
        </button>
      </div>

      <Select value={yearFilter} onValueChange={setYear}>
        <SelectTrigger className="h-8 w-[92px] shrink-0 border-white/[0.08] bg-transparent text-xs">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All years</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={monthFilter}
        onValueChange={(v) => setMonthFilter(v)}
        disabled={yearFilter === "all"}
      >
        <SelectTrigger className="h-8 w-[108px] shrink-0 border-white/[0.08] bg-transparent text-xs disabled:opacity-40">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => setLikedOnly((v) => !v)}
        aria-pressed={likedOnly}
        title="Liked"
        className={cn(
          "inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-xs transition",
          likedOnly
            ? "border-brand/30 bg-brand/10 text-brand"
            : "border-white/[0.08] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-100",
        )}
      >
        <Heart className={cn("size-3.5", likedOnly && "fill-current")} />
        <span className="hidden sm:inline">Liked</span>
      </button>

      {isOwnProfile ? (
        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-1">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            title="Import"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.08] px-2 text-xs text-zinc-400 transition hover:border-white/[0.14] hover:text-zinc-100"
          >
            <Upload className="size-3.5" />
            <span className="hidden md:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            title="Export CSV"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.08] px-2 text-xs text-zinc-400 transition hover:border-white/[0.14] hover:text-zinc-100"
          >
            <Download className="size-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>
        </div>
      ) : null}
    </div>
  )

  if (loading) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          Watched
        </h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        {toolbar}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border border-black/15 shadow-sm shadow-black/5 dark:border-white/15 dark:shadow-white/5"
            />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mt-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          Watched
        </h2>
        <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        <div className="flex w-full items-start justify-between overflow-clip text-muted-foreground">
          <div className="space-y-3">
            <p className="w-full text-start">Nothing watched yet</p>
            {isOwnProfile ? (
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.08] px-2.5 text-xs text-zinc-400 transition hover:border-brand/40 hover:text-zinc-100"
              >
                <Upload className="size-3.5" />
                Import from Letterboxd
              </button>
            ) : null}
          </div>
          <RiveComponent width={400} className="invisible flex h-20 w-[222px] pl-9" />
        </div>
        {isOwnProfile ? (
          <ImportLetterboxdDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            onImported={() => {
              setLoading(true)
              void fetchWatched()
            }}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
          Watched
        </h2>
        <span className="text-xs text-muted-foreground/60">
          {filtered.length}
          {filtered.length !== items.length ? ` of ${items.length}` : ""}{" "}
          {filtered.length === 1 ? "title" : "titles"}
        </span>
      </div>
      <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />

      {toolbar}

      {view === "calendar" ? (
        <div className="space-y-4">
          <WatchedCalendar
            items={calendarItems}
            year={calYear}
            monthIndex={calMonth}
            onMonthChange={(y, m) => {
              setCalYear(y)
              setCalMonth(m)
              setYearFilter(String(y))
              setMonthFilter(String(m + 1).padStart(2, "0"))
            }}
            onSelectDay={(date, dayItems) => {
              if (dayItems.length === 1 && !isOwnProfile) {
                const only = dayItems[0]
                router.push(diaryItemHref(only))
                return
              }
              setDaySheet({ date, items: dayItems })
            }}
          />

          {daySheet ? (
            <div className="rounded-lg border border-white/[0.08] bg-zinc-950/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-100">
                  {formatWatchedDate(daySheet.date)}
                </p>
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={() => setDaySheet(null)}
                >
                  Close
                </button>
              </div>
              <ul className="space-y-2">
                {daySheet.items.map((dayItem) => {
                  const full = items.find((i) => i.id === dayItem.id)
                  const href = diaryItemHref({
                    ...dayItem,
                    release_date: full?.release_date ?? dayItem.release_date,
                  })
                  const rewatch = formatRewatchLabel(full?.rewatch_count ?? 0)

                  return (
                    <li
                      key={dayItem.id}
                      className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-black/20 p-2"
                    >
                      <Link href={href} className="relative size-12 shrink-0 overflow-hidden rounded">
                        {dayItem.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${dayItem.poster_path}`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-zinc-900 text-xs text-zinc-500">
                            ?
                          </div>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={href}
                          className="block truncate text-sm font-medium text-zinc-100 hover:text-brand"
                        >
                          {dayItem.movie_title || "Untitled"}
                        </Link>
                        {rewatch ? (
                          <p className="text-xs text-zinc-500">{rewatch}</p>
                        ) : null}
                      </div>
                      {isOwnProfile && full ? (
                        <button
                          type="button"
                          onClick={() => openEdit(full)}
                          className="rounded-full p-2 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                          aria-label="Edit watch log"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">
          No titles for this period.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {filtered.map((item) => {
            const key = `${item.tmdb_id}-${item.media_type ?? "movie"}-${item.id}`
            const isTv = item.media_type === "tv"
            const edit = posterEditAction(item)

            return isTv ? (
              <SeriesCard
                key={key}
                externalid={item.tmdb_id}
                series={{
                  id: item.tmdb_id,
                  name: item.movie_title ?? "",
                  poster_path: item.poster_path,
                  first_air_date: item.release_date,
                }}
                extraActions={edit}
              />
            ) : (
              <MovieCard
                key={key}
                externalid={item.tmdb_id}
                movie={{
                  id: item.tmdb_id,
                  title: item.movie_title ?? "",
                  poster_path: item.poster_path,
                  vote_average: 0,
                }}
                extraActions={edit}
              />
            )
          })}
        </div>
      )}

      <EditWatchLogDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        title={editing?.movie_title ?? undefined}
        watchedDate={editing?.watched_date ?? null}
        rewatchCount={editing?.rewatch_count ?? 0}
        loading={saving}
        onSave={handleSaveEdit}
        onUnwatch={handleUnwatch}
      />

      {isOwnProfile ? (
        <ImportLetterboxdDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={() => {
            setLoading(true)
            void fetchWatched()
          }}
        />
      ) : null}
    </div>
  )
}
