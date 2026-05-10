"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { flushSync } from "react-dom"
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { Hand, Plus, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ListMediaType } from "@/types/list"

const POSTER = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w500${path}` : "/placeholder.png"

export interface DeckMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string | null
}

export interface PickedMovie {
  tmdb_id: number
  title: string
  poster_path?: string
  release_date?: string
  media_type: ListMediaType
}

const SWIPE_X = 120
export const MIN_TITLES_TO_FINISH = 5

const REFILL_THRESHOLD = 18
const INITIAL_DECK_TARGET = 36
const REFILL_CHUNK_MIN = 20
const MAX_REFILL_FETCH_PASSES = 14

const DISCOVER_SORTS = ["popularity.desc", "vote_average.desc", "release_date.desc"] as const

function shuffleMovies<T>(movies: T[]): T[] {
  const a = [...movies]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function discoverGenrePage(
  genreId: number,
  page: number,
  sortBy: string,
): Promise<{ rows: DeckMovie[]; totalPages: number }> {
  const qs = new URLSearchParams({
    with_genres: String(genreId),
    sort_by: sortBy,
    page: String(page),
    "vote_count.gte": "40",
  })
  const res = await fetch(`/api/movies/discover?${qs.toString()}`)
  if (!res.ok) throw new Error("discover")
  const data = await res.json()
  const tp = Math.max(1, Number(data.total_pages) || 1)
  const results = Array.isArray(data.results) ? data.results : []
  const rows: DeckMovie[] = []
  for (const r of results) {
    rows.push({
      id: Number(r.id),
      title: r.title ?? "",
      poster_path: r.poster_path ?? null,
      release_date: r.release_date ?? null,
    })
  }
  return { rows, totalPages: tp }
}

function takeNewMovies(rows: DeckMovie[], seen: Set<number>): DeckMovie[] {
  const out: DeckMovie[] = []
  for (const m of rows) {
    if (seen.has(m.id)) continue
    seen.add(m.id)
    out.push(m)
  }
  return shuffleMovies(out)
}

interface NewListSwipeStepProps {
  genreIds: number[]
  pickedCount: number
  onAddPick: (item: PickedMovie) => void
  onCanFinishChange?: (ok: boolean) => void
  canFinalize?: boolean
  onFinalize?: () => void | Promise<void>
  /** Desabilita o botão Finish durante persistência no servidor. */
  finalizeBusy?: boolean
  compactLayout?: boolean
}

export function NewListSwipeStep({
  genreIds,
  pickedCount,
  onAddPick,
  onCanFinishChange,
  canFinalize = false,
  onFinalize,
  finalizeBusy = false,
  compactLayout = false,
}: NewListSwipeStepProps) {
  const [deck, setDeck] = useState<DeckMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [deckTailBuffering, setDeckTailBuffering] = useState(false)

  const seenIdsRef = useRef(new Set<number>())
  const genreNextPageRef = useRef(new Map<number, number>())
  const genreTotalPagesRef = useRef(new Map<number, number>())
  const sortCursorRef = useRef(0)
  const loadingChunkRef = useRef(false)

  /** Mostra de novo em cada fluxo (montagem do passo 3); some só até o primeiro toque nesta sessão. */
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  const current = deck[index] ?? null
  const remainingInDeck = Math.max(0, deck.length - index)

  const deckExhausted =
    !loading && !deckTailBuffering && deck.length > 0 && index >= deck.length

  useEffect(() => {
    const ok =
      pickedCount >= MIN_TITLES_TO_FINISH || (deckExhausted && pickedCount > 0)
    onCanFinishChange?.(ok)
  }, [pickedCount, deckExhausted, onCanFinishChange])

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false)
  }, [])

  const pullOneGenrePage = useCallback(
    async (genreIdList: number[], sortBy: string): Promise<DeckMovie[]> => {
      const seen = seenIdsRef.current
      const batch: DeckMovie[] = []
      for (const gid of genreIdList) {
        const totalPagesStored = genreTotalPagesRef.current.get(gid)
        let page = genreNextPageRef.current.get(gid) ?? 1
        let totalPages = totalPagesStored ?? 500
        if (page > totalPages) page = 1
        const { rows, totalPages: tp } = await discoverGenrePage(gid, page, sortBy)
        genreTotalPagesRef.current.set(gid, tp)
        const nextPage = page >= tp ? 1 : page + 1
        genreNextPageRef.current.set(gid, nextPage)
        batch.push(...takeNewMovies(rows, seen))
      }
      return shuffleMovies(batch)
    },
    [],
  )

  const pullDiscoverChunk = useCallback(async (genreIdList: number[]): Promise<DeckMovie[]> => {
    if (genreIdList.length === 0) return []
    let sortIdx = sortCursorRef.current % DISCOVER_SORTS.length
    const sortBy = DISCOVER_SORTS[sortIdx]!
    let batch = await pullOneGenrePage(genreIdList, sortBy)
    if (batch.length === 0) {
      sortCursorRef.current += 1
      sortIdx = sortCursorRef.current % DISCOVER_SORTS.length
      batch = await pullOneGenrePage(genreIdList, DISCOVER_SORTS[sortIdx]!)
      if (batch.length === 0) sortCursorRef.current += 1
    }
    return batch
  }, [pullOneGenrePage])

  useEffect(() => {
    let cancelled = false
    if (genreIds.length === 0) {
      setDeck([])
      setLoading(false)
      setFetchError(null)
      seenIdsRef.current.clear()
      genreNextPageRef.current.clear()
      genreTotalPagesRef.current.clear()
      sortCursorRef.current = 0
      return
    }

    ;(async () => {
      setLoading(true)
      setFetchError(null)
      setIndex(0)
      seenIdsRef.current.clear()
      genreNextPageRef.current.clear()
      genreTotalPagesRef.current.clear()
      sortCursorRef.current = 0

      try {
        const merged: DeckMovie[] = []
        let guard = 0
        while (merged.length < INITIAL_DECK_TARGET && guard < 24 && !cancelled) {
          guard += 1
          const chunk = await pullDiscoverChunk(genreIds)
          merged.push(...chunk)
          if (chunk.length === 0) sortCursorRef.current += 1
        }
        if (cancelled) return
        if (merged.length === 0) {
          setFetchError("Could not load titles. Try again.")
          setDeck([])
        } else {
          setDeck(shuffleMovies(merged))
          setFetchError(null)
        }
      } catch {
        if (!cancelled) {
          setFetchError("Could not load titles. Try again.")
          setDeck([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [genreIds, pullDiscoverChunk])

  useEffect(() => {
    if (loading || fetchError || genreIds.length === 0) return
    const remaining = deck.length - index
    if (remaining > REFILL_THRESHOLD) return
    if (loadingChunkRef.current) return

    loadingChunkRef.current = true
    setDeckTailBuffering(true)
    void (async () => {
      try {
        let extra: DeckMovie[] = []
        let passes = 0
        while (extra.length < REFILL_CHUNK_MIN && passes < MAX_REFILL_FETCH_PASSES) {
          passes += 1
          const chunk = await pullDiscoverChunk(genreIds)
          if (chunk.length === 0) {
            sortCursorRef.current += 1
            continue
          }
          extra.push(...chunk)
        }
        if (extra.length > 0) setDeck((d) => [...d, ...extra])
      } catch {
        //
      } finally {
        loadingChunkRef.current = false
        setDeckTailBuffering(false)
      }
    })()
  }, [deck.length, index, genreIds, pullDiscoverChunk, loading, fetchError])

  const toPick = useCallback(
    (m: DeckMovie) => ({
      tmdb_id: m.id,
      title: m.title,
      poster_path: m.poster_path ?? undefined,
      release_date: m.release_date ?? undefined,
      media_type: "movie" as const,
    }),
    [],
  )

  /** Card exit direction before index advances */
  const [leaveTo, setLeaveTo] = useState<"L" | "R">("R")

  const addAndAdvance = useCallback(
    (m: DeckMovie) => {
      flushSync(() => {
        setLeaveTo("R")
      })
      onAddPick(toPick(m))
      setIndex((i) => i + 1)
    },
    [onAddPick, toPick],
  )

  const skipAdvance = useCallback(() => {
    flushSync(() => {
      setLeaveTo("L")
    })
    setIndex((i) => i + 1)
  }, [])

  const nextBehind = deck[index + 1]

  const deckShellClass = cn(
    "relative mx-auto aspect-[2/3] w-full overflow-visible",
    compactLayout
      ? "max-h-[min(56dvh,520px)] max-w-[min(320px,calc(100vw-1.25rem))]"
      : "max-w-[min(320px,calc(100vw-2.5rem))]",
  )

  const deckFallbackClass = cn(
    "mx-auto flex w-full rounded-[20px] px-4",
    compactLayout
      ? "max-w-[min(320px,calc(100vw-2rem))] min-h-[min(340px,50dvh)]"
      : "max-w-[min(320px,calc(100vw-2.5rem))] min-h-[min(460px,70dvh)]",
  )

  /** Same outer size as the swipe poster (`deckShellClass`). */
  const posterSkeletonClass = cn(
    deckShellClass,
    "relative shrink-0 overflow-hidden rounded-[20px] border border-white/[0.12] bg-[#18181B]/40",
  )

  const actionColumnClass = cn(
    "mx-auto w-full",
    compactLayout ? "max-w-[min(320px,calc(100vw-1.25rem))]" : "max-w-[min(320px,calc(100vw-2.5rem))]",
  )

  const finalizeControl =
    onFinalize ? (
      <button
        type="button"
        disabled={!canFinalize || finalizeBusy}
        title={
          canFinalize
            ? undefined
            : `Add at least ${MIN_TITLES_TO_FINISH} movies to your list (or finish if suggestions run out).`
        }
        onClick={() => void onFinalize()}
        className={cn(
          "flex h-11 w-full shrink-0 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
          canFinalize && !finalizeBusy
            ? "bg-[#FF0048] text-white hover:bg-[#e60042]"
            : "cursor-not-allowed bg-white/[0.08] text-zinc-600",
        )}
      >
        {finalizeBusy ? "Saving…" : "Finish"}
      </button>
    ) : null

  let body: ReactNode
  if (loading) {
    body = (
      <div className="flex w-full flex-col items-center">
        <div className={cn(posterSkeletonClass, "ring-1 ring-inset ring-white/[0.06]")}>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800/75 to-zinc-900/35" />
          <div className="relative z-[1] flex h-full w-full items-center justify-center px-3">
            <p className="text-center text-sm text-zinc-500">Loading suggestions…</p>
          </div>
        </div>
        {finalizeControl ? (
          <div className={cn(actionColumnClass, "mt-5")}>{finalizeControl}</div>
        ) : null}
      </div>
    )
  } else if (fetchError) {
    body = (
      <div className="flex w-full flex-col items-center">
        <div
          className={cn(
            deckFallbackClass,
            "items-center justify-center border border-red-500/25 bg-red-500/[0.06]",
          )}
        >
          <p className="text-center text-sm text-red-300/95">{fetchError}</p>
        </div>
        {finalizeControl ? (
          <div className={cn(actionColumnClass, "mt-5")}>{finalizeControl}</div>
        ) : null}
      </div>
    )
  } else if (!current && deckTailBuffering) {
    body = (
      <div className="flex w-full flex-col items-center">
        <div className={cn(posterSkeletonClass, "ring-1 ring-inset ring-white/[0.06]")}>
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800/75 to-zinc-900/35" />
          <div className="relative z-[1] flex h-full w-full items-center justify-center px-3">
            <p className="text-center text-sm text-zinc-500">Loading more…</p>
          </div>
        </div>
        {finalizeControl ? (
          <div className={cn(actionColumnClass, "mt-5")}>{finalizeControl}</div>
        ) : null}
      </div>
    )
  } else if (!current) {
    body = (
      <div className="flex w-full flex-col items-center">
        <div
          className={cn(
            deckFallbackClass,
            "items-center justify-center border border-white/[0.08] bg-white/[0.025]",
          )}
        >
          <p className="max-w-xs text-center text-sm leading-relaxed text-zinc-400">
            {pickedCount === 0
              ? "No suggestions here. Go back one step and adjust your list genres."
              : "Could not load more suggestions right now. You can still finish with what you added."}
          </p>
        </div>
        {finalizeControl ? (
          <div className={cn(actionColumnClass, "mt-5")}>{finalizeControl}</div>
        ) : null}
      </div>
    )
  } else {
    const showDragHintOverlay = showSwipeHint && current !== null
    body = (
      <div
        className="flex w-full flex-col items-center"
        onPointerDownCapture={
          showSwipeHint ? () => void dismissSwipeHint() : undefined
        }
      >
        <div className="relative flex w-full max-w-[min(480px,calc(100vw-1rem))] items-stretch justify-center gap-2 sm:gap-4">
          <span className="hidden w-[4rem] shrink-0 pt-[min(28%,175px)] text-right text-[10px] font-medium uppercase tracking-wider text-zinc-600 sm:block">
            Skip
            <span className="mt-0.5 block text-zinc-500 normal-case tracking-normal">drag ←</span>
          </span>

          <div className={cn(deckShellClass, "shrink-0 drop-shadow-[0_20px_40px_rgba(0,0,0,0.42)]")}>
            {nextBehind ? (
              <div
                className="pointer-events-none absolute inset-0 z-0 translate-y-[10px] scale-[0.94] rounded-[20px] border border-white/[0.06] bg-[#0c0c0e] opacity-[0.55]"
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={POSTER(nextBehind.poster_path)}
                  alt=""
                  className="h-full w-full rounded-[20px] object-cover opacity-50"
                />
              </div>
            ) : null}
            <AnimatePresence>
              {showDragHintOverlay ? (
                <motion.div
                  key="swipe-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pointer-events-none absolute inset-0 z-[25] flex items-center justify-center"
                  aria-hidden
                >
                  <motion.div
                    className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-white/30 bg-black/50 shadow-lg backdrop-blur-[2px]"
                    animate={{ x: [-14, 14, -14] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut",
                    }}
                  >
                    <Hand className="h-9 w-9 text-white" strokeWidth={1.5} aria-hidden />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <AnimatePresence mode="sync" initial={false} onExitComplete={() => setLeaveTo("R")}>
              <SwipeCard
                key={current.id}
                movie={current}
                leaveTo={leaveTo}
                onSwipeLeft={skipAdvance}
                onSwipeRight={() => addAndAdvance(current)}
                onDragResolve={(dir) => setLeaveTo(dir)}
              />
            </AnimatePresence>
          </div>

          <span className="hidden w-[4rem] shrink-0 pt-[min(28%,175px)] text-left text-[10px] font-medium uppercase tracking-wider text-zinc-600 sm:block">
            On list
            <span className="mt-0.5 block text-zinc-500 normal-case tracking-normal">drag →</span>
          </span>
        </div>

        <div
          className={cn(
            actionColumnClass,
            "mt-5 flex shrink-0 flex-col gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:mt-6 sm:pb-4",
          )}
        >
          <div className="flex justify-center gap-8 text-[10px] text-zinc-500 sm:hidden">
            <span>Skip ←</span>
            <span>→ On list</span>
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={skipAdvance}
              className="flex h-11 min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/[0.08] active:bg-white/[0.06]"
            >
              <SkipForward className="h-4 w-4 shrink-0 opacity-80" />
              Skip
            </button>
            <button
              type="button"
              onClick={() => addAndAdvance(current)}
              className="flex h-11 min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#FF0048] text-sm font-semibold text-white shadow-lg shadow-black/35 transition-colors hover:bg-[#e60042] active:bg-[#d4003c]"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              Add to list
            </button>
          </div>
          {finalizeControl}
        </div>
      </div>
    )
  }

  const footNote =
    deckExhausted && pickedCount < MIN_TITLES_TO_FINISH ? (
      <p className="mt-2 line-clamp-2 text-center text-[10px] leading-snug text-amber-200/80">
        Couldn&apos;t load more suggestions. Finish with what you have or go back to genres.
      </p>
    ) : null

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col px-3 sm:px-4",
        compactLayout && "min-h-0 flex-1",
      )}
    >
      <div className="min-w-0 shrink-0 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Add to your list</h2>
        <div className="mt-1 flex min-h-[3rem] items-start justify-center sm:min-h-[3.25rem]">
          <p className="text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
            Swipe sideways to add movies to your list.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 w-full flex-col items-center",
          compactLayout ? "mt-6 min-h-0 flex-1 justify-between" : "mt-6 justify-start",
        )}
      >
        {body}
      </div>

      {footNote}
    </div>
  )
}

interface SwipeCardProps {
  movie: DeckMovie
  leaveTo: "L" | "R"
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onDragResolve: (dir: "L" | "R") => void
}

function SwipeCard({
  movie,
  leaveTo,
  onSwipeLeft,
  onSwipeRight,
  onDragResolve,
}: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const likeOpacity = useTransform(x, [24, 90], [0, 1])
  const nopeOpacity = useTransform(x, [-90, -24], [1, 0])

  const dragActive = useRef(false)
  const dragOrigin = useRef({ pointerX: 0, mvX: 0 })

  const clampX = (v: number) => Math.min(280, Math.max(-280, v))

  const releasePointerCaptureSafe = (el: HTMLDivElement, pointerId: number) => {
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId)
    } catch {
      //
    }
  }

  const finishDrag = (el: HTMLDivElement, pointerId: number) => {
    if (!dragActive.current) return
    dragActive.current = false
    releasePointerCaptureSafe(el, pointerId)

    const off = x.get()
    if (off > SWIPE_X) {
      onDragResolve("R")
      onSwipeRight()
      return
    }
    if (off < -SWIPE_X) {
      onDragResolve("L")
      onSwipeLeft()
      return
    }
    animate(x, 0, { type: "spring", stiffness: 520, damping: 38 })
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragActive.current = true
    dragOrigin.current = { pointerX: e.clientX, mvX: x.get() }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragActive.current) return
    const dx = e.clientX - dragOrigin.current.pointerX
    x.set(clampX(dragOrigin.current.mvX + dx))
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId)
  }

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(e.currentTarget, e.pointerId)
  }

  const toLeft = leaveTo === "L"

  return (
    <motion.div
      layout={false}
      className="absolute inset-0 z-[1] cursor-grab touch-none select-none active:cursor-grabbing"
      style={{ x, rotate }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      initial={{ scale: 0.98, opacity: 0.9 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: toLeft ? -260 : 260,
        opacity: 0,
        rotate: toLeft ? -14 : 14,
        transition: { duration: 0.22 },
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-white/[0.12] bg-[#18181B] shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={POSTER(movie.poster_path)}
          alt={movie.title}
          className="h-full w-full rounded-[20px] object-cover"
          draggable={false}
        />
        <motion.span
          className="pointer-events-none absolute left-6 top-8 rotate-[-12deg] rounded-lg border-4 border-[#FF0048]/80 bg-[#0a0a0c]/85 px-3 py-1.5 text-lg font-black uppercase text-[#FF0048] shadow-lg backdrop-blur-sm"
          style={{ opacity: likeOpacity }}
        >
          On list
        </motion.span>
        <motion.span
          className="pointer-events-none absolute right-6 top-8 rotate-[12deg] rounded-lg border-4 border-zinc-500 bg-[#0a0a0c]/85 px-3 py-1.5 text-lg font-black uppercase text-zinc-100 shadow-lg backdrop-blur-sm"
          style={{ opacity: nopeOpacity }}
        >
          Skip
        </motion.span>
      </div>
    </motion.div>
  )
}
