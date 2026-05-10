"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export interface GenreOption {
  id: number
  name: string
}

/** Evita novo fetch ao voltar do passo de filmes / remontar o passo de gêneros na mesma sessão SPA. */
let cachedGenres: GenreOption[] | null = null

interface NewListGenreStepProps {
  selectedIds: number[]
  onChangeSelected: (ids: number[]) => void
}

export function NewListGenreStep({ selectedIds, onChangeSelected }: NewListGenreStepProps) {
  const [genres, setGenres] = useState<GenreOption[]>(() => cachedGenres ?? [])
  const [loading, setLoading] = useState(() => cachedGenres === null)

  useEffect(() => {
    if (cachedGenres) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/movies/genres?language=en-US")
        const data = await res.json()
        if (!cancelled && Array.isArray(data.genres)) {
          cachedGenres = data.genres
          setGenres(data.genres)
        }
      } catch {
        if (!cancelled) setGenres([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChangeSelected(selectedIds.filter((x) => x !== id))
    } else {
      onChangeSelected([...selectedIds, id])
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-3 sm:px-4">
      <div className="min-w-0 shrink-0 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          Add genres to your list
        </h2>
        <div className="mt-1 flex min-h-[3rem] items-start justify-center sm:min-h-[3.25rem]">
          <p className="text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
            Choose one or more genres — we&apos;ll use them to suggest movies in the next step.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-center text-sm text-zinc-500">Loading genres…</p>
      ) : (
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {genres.map((g) => {
            const on = selectedIds.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggle(g.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  on
                    ? "border-[#FF0048] bg-[#FF0048]/15 text-white"
                    : "border-white/15 bg-white/[0.06] text-zinc-300 hover:border-white/25 hover:bg-white/[0.09]",
                )}
              >
                {g.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
