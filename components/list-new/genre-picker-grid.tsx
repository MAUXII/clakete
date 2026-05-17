"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { GenreOption } from "@/components/list-new/new-list-genre-step"

const cachedGenresByLang = new Map<string, GenreOption[]>()

interface GenrePickerGridProps {
  selectedIds: number[]
  onChangeSelected: (ids: number[]) => void
  className?: string
  language?: string
  /** Estilo pills do onboarding (selecionado = fundo branco). */
  variant?: "list" | "onboarding"
}

export function GenrePickerGrid({
  selectedIds,
  onChangeSelected,
  className,
  language = "en-US",
  variant = "list",
}: GenrePickerGridProps) {
  const [genres, setGenres] = useState<GenreOption[]>(
    () => cachedGenresByLang.get(language) ?? [],
  )
  const [loading, setLoading] = useState(() => !cachedGenresByLang.has(language))
  const isOnboarding = variant === "onboarding"

  useEffect(() => {
    if (cachedGenresByLang.has(language)) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/movies/genres?language=${encodeURIComponent(language)}`)
        const data = await res.json()
        if (!cancelled && Array.isArray(data.genres)) {
          cachedGenresByLang.set(language, data.genres)
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
  }, [language])

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChangeSelected(selectedIds.filter((x) => x !== id))
    } else {
      onChangeSelected([...selectedIds, id])
    }
  }

  if (loading) {
    return (
      <p className={cn("text-center text-sm text-zinc-500", className)}>
        {isOnboarding ? "Carregando gêneros…" : "Loading genres…"}
      </p>
    )
  }

  return (
    <div className={cn("flex flex-wrap justify-center gap-2.5", className)}>
      {genres.map((g) => {
        const on = selectedIds.includes(g.id)
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isOnboarding
                ? on
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.08] text-zinc-200 hover:bg-white/[0.12]"
                : on
                  ? "border-[#FF0048] bg-[#FF0048]/15 text-white"
                  : "border-white/15 bg-white/[0.06] text-zinc-300 hover:border-white/25 hover:bg-white/[0.09]",
            )}
          >
            {g.name}
          </button>
        )
      })}
    </div>
  )
}
