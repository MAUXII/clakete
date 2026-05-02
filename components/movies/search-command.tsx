'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch } from "@/hooks/use-media-search"
import { CommandDialog } from "@/components/ui/command"
import { Search } from "lucide-react"
import { Button } from "../ui/button"
import { MediaSearchCommandContent } from "./media-search-command-content"

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)
  const { filmResults, seriesResults, loading } = useMediaSearch(debouncedQuery, open)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative border-none h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search</span>
        <span className="sr-only">Buscar filmes</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <MediaSearchCommandContent
          query={query}
          onQueryChange={setQuery}
          filmResults={filmResults}
          seriesResults={seriesResults}
          loading={loading}
          onSelectFilm={(movie) => {
            router.push(`/film/${movie.id}`)
            setOpen(false)
          }}
          onSelectSeries={(series) => {
            router.push(`/series/${series.id}`)
            setOpen(false)
          }}
        />
      </CommandDialog>
    </>
  )
}
