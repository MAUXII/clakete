'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch } from "@/hooks/use-media-search"
import { useUserSearch } from "@/hooks/use-user-search"
import { useDesignMode } from "@/hooks/use-design-mode"
import { CommandDialog } from "@/components/ui/command"
import { Search } from "lucide-react"
import { Button } from "../ui/button"
import { MediaSearchCommandContent } from "./media-search-command-content"
import { useT } from "@/components/providers/i18n-provider"
import { filmHref, seriesHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"

export function SearchCommand({
  variant = "default",
}: {
  variant?: "default" | "rail" | "nav"
}) {
  const { t } = useT()
  const router = useRouter()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, isGlass ? 480 : 300)
  const querySettled = query.trim() === debouncedQuery.trim()
  const searchEnabled = open && (!isGlass || debouncedQuery.trim().length > 0)
  const { filmResults, seriesResults, loading } = useMediaSearch(
    debouncedQuery,
    searchEnabled,
  )
  const { results: peopleResults, loading: peopleLoading } = useUserSearch(
    debouncedQuery,
    searchEnabled,
  )

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

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery("")
  }

  const dialog = (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      glassSearch={isGlass}
      contentClassName={cn(
        isGlass &&
          "!top-[18vh] !translate-y-0 border-0 bg-transparent p-0 shadow-none sm:max-w-xl sm:rounded-none data-[state=open]:!slide-in-from-top-3 data-[state=closed]:!slide-out-to-top-2 data-[state=closed]:!slide-out-to-left-1/2 data-[state=open]:!slide-in-from-left-1/2",
      )}
      commandClassName={cn(isGlass && "bg-transparent text-white")}
    >
      <MediaSearchCommandContent
        appearance={isGlass ? "glass" : "default"}
        query={query}
        onQueryChange={setQuery}
        querySettled={querySettled}
        filmResults={filmResults}
        seriesResults={seriesResults}
        loading={loading}
        peopleResults={peopleResults}
        peopleLoading={peopleLoading}
        inputPlaceholder={t("common.searchPlaceholder")}
        onSelectFilm={(movie) => {
          router.push(
            filmHref({
              id: movie.id,
              title: movie.title,
              original_title: movie.original_title,
              release_date: movie.release_date,
            }),
          )
          handleOpenChange(false)
        }}
        onSelectSeries={(series) => {
          router.push(
            seriesHref({
              id: series.id,
              name: series.name,
              original_name: series.original_name,
              first_air_date: series.first_air_date,
            }),
          )
          handleOpenChange(false)
        }}
        onSelectPerson={(person) => {
          router.push(`/${person.username}`)
          handleOpenChange(false)
        }}
      />
    </CommandDialog>
  )

  if (variant === "rail") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-[15px] font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
        >
          <Search className="size-5 shrink-0" strokeWidth={1.75} />
          <span>{t("common.search")}</span>
        </button>
        {dialog}
      </>
    )
  }

  if (variant === "nav") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("common.search")}
          className="inline-flex rounded-md p-1.5 text-foreground/45 transition hover:bg-muted/50 hover:text-foreground"
        >
          <Search className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {dialog}
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative border-none h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">{t("common.search")}</span>
        <span className="sr-only">{t("common.searchFilmsPeople")}</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      {dialog}
    </>
  )
}
