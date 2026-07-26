"use client"

import { useEffect, useState } from "react"
import { UserRound, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConnectNode } from "@/lib/games/connect-the-stars"
import { tmdbPosterUrl } from "@/lib/games/connect-the-stars"
import { cn } from "@/lib/utils"

type Props = {
  index: 1 | 2
  placeholder: string
  chooseForMeLabel: string
  value: ConnectNode | null
  onChange: (node: ConnectNode | null) => void
  onChooseForMe: () => void
  choosing?: boolean
  excludeId?: number | null
  language?: string
}

/** Minimal Clakete setup card — layout inspired by dual pickers, not the mock art. */
export function ActorStarCard({
  index,
  placeholder,
  chooseForMeLabel,
  value,
  onChange,
  onChooseForMe,
  choosing = false,
  excludeId,
  language = "pt-BR",
}: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ConnectNode[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const t = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const res = await fetch(
            `/api/games/search/people?q=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}`,
          )
          const data = (await res.json()) as { results?: ConnectNode[] }
          setResults((data.results ?? []).filter((r) => r.id !== excludeId))
          setOpen(true)
        } catch {
          setResults([])
        } finally {
          setLoading(false)
        }
      })()
    }, 280)
    return () => window.clearTimeout(t)
  }, [query, value, excludeId, language])

  const src = value ? tmdbPosterUrl(value.imagePath, "w500") : null

  return (
    <div className="relative flex w-full max-w-[260px] flex-col overflow-visible rounded-2xl border border-border bg-card shadow-sm sm:max-w-[300px]">
      <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
        {index}
      </span>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-2xl bg-muted/40">
        {value && src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={value.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setQuery("")
              }}
              className="absolute right-2 top-2 rounded-md border border-border bg-background/80 p-1.5 text-muted-foreground backdrop-blur transition hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background">
              <UserRound className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      <div className="relative border-t border-border">
        <input
          value={value ? value.name : query}
          onChange={(e) => {
            if (value) onChange(null)
            setQuery(e.target.value)
          }}
          onFocus={() => !value && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={Boolean(value)}
          className={cn(
            "w-full border-0 bg-transparent px-4 py-3.5 text-sm text-foreground outline-none",
            "placeholder:text-muted-foreground disabled:cursor-default disabled:opacity-90",
          )}
        />
        {open &&
        !value &&
        (loading || results.length > 0 || query.trim().length >= 2) ? (
          <div className="absolute inset-x-0 top-full z-30 max-h-52 overflow-y-auto border border-border bg-popover shadow-lg">
            {loading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : results.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">—</p>
            ) : (
              <ul>
                {results.map((r) => {
                  const thumb = tmdbPosterUrl(r.imagePath, "w92")
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted/60"
                        onClick={() => {
                          onChange(r)
                          setOpen(false)
                          setQuery("")
                          setResults([])
                        }}
                      >
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <span className="truncate text-sm text-foreground">
                          {r.name}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        disabled={choosing}
        onClick={onChooseForMe}
        className={cn(
          "w-full rounded-b-2xl rounded-t-none border-0 px-4 py-3.5 text-sm font-medium text-white",
          "bg-brand transition hover:bg-brand-hover disabled:opacity-60",
        )}
      >
        {choosing ? "…" : chooseForMeLabel}
      </button>
    </div>
  )
}
