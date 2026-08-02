"use client"

import { useRef, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { FileUp, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  collapseLetterboxdRows,
  letterboxdRatingToClakete,
  parseLetterboxdCsv,
  type LetterboxdCollapsedEntry,
} from "@/lib/letterboxd-import"
import { toLocalDateString } from "@/lib/watched-date"
import { useT } from "@/components/providers/i18n-provider"

type MatchResult = {
  tmdbId: number
  title: string
  posterPath: string | null
  releaseDate: string | null
  mediaType: "movie"
} | null

type ResolvedEntry = LetterboxdCollapsedEntry & {
  match: MatchResult
}

type Phase = "pick" | "matching" | "ready" | "importing" | "done"

const MATCH_BATCH = 25

export function ImportLetterboxdDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const user = useUser()
  const fileRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>("pick")
  const [fileName, setFileName] = useState<string | null>(null)
  const [resolved, setResolved] = useState<ResolvedEntry[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [stats, setStats] = useState({ imported: 0, skipped: 0, unmatched: 0 })

  const reset = () => {
    setPhase("pick")
    setFileName(null)
    setResolved([])
    setProgress({ done: 0, total: 0 })
    setStats({ imported: 0, skipped: 0, unmatched: 0 })
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      if (phase === "matching" || phase === "importing") return
      reset()
    }
    onOpenChange(next)
  }

  const matchBatch = async (
    entries: LetterboxdCollapsedEntry[],
  ): Promise<MatchResult[]> => {
    const res = await fetch("/api/letterboxd/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: entries.map((e) => ({ name: e.name, year: e.year })),
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "TMDB match failed")
    }
    const data = await res.json()
    return (data.matches ?? []) as MatchResult[]
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error(t("profile.uploadCsvError"))
      return
    }

    setFileName(file.name)
    setPhase("matching")

    try {
      const text = await file.text()
      const rows = parseLetterboxdCsv(text)
      if (rows.length === 0) {
        toast.error(t("profile.noCsvRows"))
        reset()
        return
      }

      const collapsed = collapseLetterboxdRows(rows)
      setProgress({ done: 0, total: collapsed.length })

      const all: ResolvedEntry[] = []
      for (let i = 0; i < collapsed.length; i += MATCH_BATCH) {
        const slice = collapsed.slice(i, i + MATCH_BATCH)
        const matches = await matchBatch(slice)
        for (let j = 0; j < slice.length; j++) {
          all.push({ ...slice[j], match: matches[j] ?? null })
        }
        setProgress({ done: Math.min(i + slice.length, collapsed.length), total: collapsed.length })
        setResolved([...all])
      }

      const unmatched = all.filter((e) => !e.match).length
      setStats((s) => ({ ...s, unmatched }))
      setPhase("ready")
      toast.success(
        `Matched ${all.length - unmatched} of ${all.length} titles`,
      )
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : t("common.errorGeneric"))
      reset()
    }
  }

  const runImport = async () => {
    if (!user) {
      toast.error(t("common.signIn"))
      return
    }

    const toImport = resolved.filter((e) => e.match)
    if (toImport.length === 0) {
      toast.message(t("profile.noMatchesToImport"))
      return
    }

    setPhase("importing")
    setProgress({ done: 0, total: toImport.length })

    let imported = 0
    let skipped = 0
    const unmatched = resolved.length - toImport.length

    // Prefetch existing interactions for merge
    const tmdbIds = toImport.map((e) => e.match!.tmdbId)
    const existingMap = new Map<
      number,
      { rating: number | null; rewatch_count: number | null; watched_date: string | null }
    >()

    // chunk .in() queries
    for (let i = 0; i < tmdbIds.length; i += 100) {
      const chunk = tmdbIds.slice(i, i + 100)
      const { data } = await supabase
        .from("items_interactions")
        .select("tmdb_id, rating, rewatch_count, watched_date")
        .eq("user_id", user.id)
        .eq("media_type", "movie")
        .in("tmdb_id", chunk)

      for (const row of data ?? []) {
        existingMap.set(row.tmdb_id as number, {
          rating: row.rating,
          rewatch_count: row.rewatch_count,
          watched_date: row.watched_date,
        })
      }
    }

    const UPSERT_BATCH = 40
    for (let i = 0; i < toImport.length; i += UPSERT_BATCH) {
      const slice = toImport.slice(i, i + UPSERT_BATCH)
      const payload = slice.map((entry) => {
        const m = entry.match!
        const existing = existingMap.get(m.tmdbId)
        const importedRating = letterboxdRatingToClakete(entry.rating)
        const rating =
          importedRating > 0
            ? importedRating
            : existing?.rating && existing.rating > 0
              ? existing.rating
              : 0

        const watchedDate =
          entry.watchedDate ||
          existing?.watched_date ||
          toLocalDateString()

        const rewatchCount = Math.max(
          entry.rewatchCount,
          existing?.rewatch_count ?? 0,
        )

        return {
          user_id: user.id,
          tmdb_id: m.tmdbId,
          media_type: "movie" as const,
          is_watched: true,
          in_watchlist: false,
          watched_date: watchedDate,
          rewatch_count: rewatchCount,
          rating,
          poster_path: m.posterPath,
          movie_title: m.title,
          release_date: m.releaseDate,
          updated_at: new Date().toISOString(),
        }
      })

      const { error } = await supabase.from("items_interactions").upsert(payload, {
        onConflict: "user_id,tmdb_id,media_type",
      })

      if (error) {
        console.error(error)
        skipped += slice.length
      } else {
        imported += slice.length
      }

      setProgress({
        done: Math.min(i + slice.length, toImport.length),
        total: toImport.length,
      })
    }

    setStats({ imported, skipped, unmatched })
    setPhase("done")
    onImported?.()

    if (imported > 0) {
      toast.success(
        t("profile.importedCount", {
          count: imported,
          titles: imported === 1 ? t("profile.title") : t("profile.titles"),
        }),
      )
    }
    if (skipped > 0) {
      toast.message(t("profile.importFailed", { count: skipped }))
    }
  }

  const matchedCount = resolved.filter((e) => e.match).length
  const unmatchedCount = resolved.length - matchedCount
  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("profile.importFromLetterboxd")}</DialogTitle>
          <DialogDescription>{t("profile.importLetterboxdDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {phase === "pick" ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-10 text-center transition hover:border-brand/40 hover:bg-brand/5">
              <FileUp className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("profile.chooseLetterboxdCsv")}</span>
              <span className="text-xs text-muted-foreground">{t("profile.diaryCsvRecommended")}</span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(f)
                }}
              />
            </label>
          ) : null}

          {phase === "matching" || phase === "importing" ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin text-brand" />
                {phase === "matching"
                  ? t("profile.matchingTmdb", { done: progress.done, total: progress.total })
                  : t("profile.savingProgress", { done: progress.done, total: progress.total })}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full bg-brand transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {fileName ? (
                <p className="truncate text-xs text-muted-foreground">{fileName}</p>
              ) : null}
            </div>
          ) : null}

          {phase === "ready" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <p className="text-foreground">
                  <span className="font-medium text-foreground">{matchedCount}</span>{" "}
                  {t("profile.matched")}
                  {unmatchedCount > 0 ? (
                    <>
                      {" · "}
                      <span className="text-amber-400/90">{unmatchedCount}</span>{" "}
                      {t("profile.unmatchedSkipped")}
                    </>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("profile.importKeepHint")}
                </p>
              </div>

              {unmatchedCount > 0 && unmatchedCount <= 12 ? (
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {resolved
                    .filter((e) => !e.match)
                    .map((e) => (
                      <li key={`${e.name}-${e.year}`}>
                        {e.name}
                        {e.year ? ` (${e.year})` : ""}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {phase === "done" ? (
            <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p>
                {t("profile.importedCount", {
                  count: stats.imported,
                  titles: stats.imported === 1 ? t("profile.title") : t("profile.titles"),
                })}
                {stats.unmatched > 0
                  ? ` · ${stats.unmatched} ${t("profile.unmatchedSkipped")}`
                  : ""}
                {stats.skipped > 0
                  ? ` · ${t("profile.importFailed", { count: stats.skipped })}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {phase === "ready" ? (
            <>
              <Button type="button" variant="outline" onClick={reset}>
                {t("profile.chooseLetterboxdCsv")}
              </Button>
              <Button
                type="button"
                className="bg-brand text-white hover:bg-brand-hover"
                onClick={() => void runImport()}
                disabled={matchedCount === 0}
              >
                <Upload className="mr-1.5 size-3.5" />
                {t("profile.importAction", { count: matchedCount })}
              </Button>
            </>
          ) : phase === "done" ? (
            <Button
              type="button"
              className="bg-brand text-white hover:bg-brand-hover"
              onClick={() => handleClose(false)}
            >
              {t("common.close")}
            </Button>
          ) : phase === "pick" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              {t("common.cancel")}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
