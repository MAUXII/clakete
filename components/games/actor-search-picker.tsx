"use client"

import { useEffect, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { ConnectNode } from "@/lib/games/connect-the-stars"
import { tmdbPosterUrl } from "@/lib/games/connect-the-stars"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  placeholder: string
  value: ConnectNode | null
  onChange: (node: ConnectNode | null) => void
  excludeId?: number | null
}

export function ActorSearchPicker({
  label,
  placeholder,
  value,
  onChange,
  excludeId,
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
            `/api/games/search/people?q=${encodeURIComponent(q)}`,
          )
          const data = (await res.json()) as { results?: ConnectNode[] }
          setResults(
            (data.results ?? []).filter((r) => r.id !== excludeId),
          )
          setOpen(true)
        } catch {
          setResults([])
        } finally {
          setLoading(false)
        }
      })()
    }, 280)
    return () => window.clearTimeout(t)
  }, [query, value, excludeId])

  if (value) {
    const src = tmdbPosterUrl(value.imagePath, "w185")
    return (
      <div className="rounded-2xl border border-border bg-card p-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{value.name}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setQuery("")
            }}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      {open && (loading || results.length > 0 || query.trim().length >= 2) ? (
        <div className="absolute left-3 right-3 z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {loading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">—</p>
          ) : (
            <ul>
              {results.map((r) => {
                const src = tmdbPosterUrl(r.imagePath, "w92")
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted/60",
                      )}
                      onClick={() => {
                        onChange(r)
                        setOpen(false)
                        setQuery("")
                        setResults([])
                      }}
                    >
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
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
  )
}
