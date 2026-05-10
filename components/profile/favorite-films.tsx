"use client"

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { MovieCard } from "../movies/movie-card"
import { Plus } from "lucide-react"
import { CommandDialog } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch } from "@/hooks/use-media-search"
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content"
import type { Movie } from "@/lib/tmdb/client"
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableOverlay,
} from "@/components/ui/sortable"
import { MdDelete } from "react-icons/md"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Skeleton } from "../ui/skeleton"
import { horizontalListSortingStrategy } from "@dnd-kit/sortable"

interface Film {
  id: number
  film_id: number
  title: string
  poster_path: string
  backdrop_path: string
  release_date: string
  position: number
}

/** Um slot na lista sortável: id estável para o dnd-kit; film opcional. */
interface FavoriteSortableItem {
  id: string
  film: Film | null
}

const LOGICAL_SLOTS = [0, 1, 2, 3] as const

function cellsFromFilms(films: Film[]): (Film | null)[] {
  const c: (Film | null)[] = [null, null, null, null]
  for (const f of films) {
    if (f.position >= 1 && f.position <= 4) {
      c[f.position - 1] = f
    }
  }
  return c
}

function buildSortableItemsFromFilms(films: Film[]): FavoriteSortableItem[] {
  const cells = cellsFromFilms(films)
  return LOGICAL_SLOTS.map((idx) => ({
    id: cells[idx] ? `film-${cells[idx]!.id}` : `empty-${idx}`,
    film: cells[idx],
  }))
}

function filmsFromSortableItems(items: FavoriteSortableItem[]): Film[] {
  const out: Film[] = []
  items.forEach((item, i) => {
    if (item.film) {
      out.push({ ...item.film, position: i + 1 })
    }
  })
  return out
}

function FavoriteSlot({
  film,
  onRemove,
  onSelect,
  canEdit,
}: {
  film?: Film
  onRemove: (film: Film) => void
  onSelect: () => void
  canEdit: boolean
}) {
  const handleRemoveClick = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (film) {
      onRemove(film)
    }
  }

  return (
    <div className="relative h-[225px] w-[150px] shrink-0 overflow-hidden rounded-md border bg-card group">
      {film ? (
        <ContextMenu>
          <ContextMenuTrigger>
            <img
              src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
              alt={film.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0" />
          </ContextMenuTrigger>
          {canEdit && (
            <ContextMenuContent className="w-full">
              <ContextMenuItem
                className="flex items-center gap-2 px-6 py-3 hover:bg-[#ff0048]/10 hover:text-[#ff0048] hover:dark:bg-[#ff0048]/10 hover:dark:text-[#ff0048]"
                onClick={handleRemoveClick}
                onPointerUp={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MdDelete className="text-xl" />
                <span>Delete favorite movie</span>
              </ContextMenuItem>
            </ContextMenuContent>
          )}
        </ContextMenu>
      ) : canEdit ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          onClick={onSelect}
        >
          <Plus className="h-6 w-6" />
          <span className="text-xs">Add Film</span>
        </button>
      ) : null}
    </div>
  )
}

/** Preview no overlay de drag — mesmo tamanho do slot. */
function FavoriteSlotOverlay({ film }: { film: Film }) {
  return (
    <div className="relative h-[225px] w-[150px] shrink-0 overflow-hidden rounded-md border bg-card shadow-lg">
      <img
        src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
        alt={film.title}
        className="h-full w-full object-cover"
      />
    </div>
  )
}

interface FavoriteFilmsProps {
  userId: string
  isEditable?: boolean
  onFilmAdded?: () => void
}

export function UserFavoriteFilms({ userId, isEditable = false, onFilmAdded }: FavoriteFilmsProps) {
  const [sortableItems, setSortableItems] = useState<FavoriteSortableItem[]>(() =>
    LOGICAL_SLOTS.map((idx) => ({ id: `empty-${idx}`, film: null })),
  )
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<number>(-1)
  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [query, setQuery] = useState("")

  const supabase = useSupabaseClient()
  const currentUser = useUser()
  const canEdit = isEditable || currentUser?.id === userId
  const debouncedQuery = useDebounce(query, 300)
  const { filmResults, seriesResults, loading: searchLoading } = useMediaSearch(
    debouncedQuery,
    showSearchCommand && canEdit,
  )

  const favoriteFilms = useMemo(() => filmsFromSortableItems(sortableItems), [sortableItems])

  const persistFavoriteRows = useCallback(
    async (films: Film[]) => {
      await supabase.from("users_favorite_films").delete().eq("user_id", userId)
      if (films.length === 0) return
      await supabase.from("users_favorite_films").insert(
        films.map((film) => ({
          user_id: userId,
          film_id: film.film_id,
          title: film.title,
          poster_path: film.poster_path,
          backdrop_path: film.backdrop_path || "",
          release_date: film.release_date || "",
          position: film.position,
        })),
      )
    },
    [supabase, userId],
  )

  const refetchFavorites = useCallback(async () => {
    const { data: favorites, error } = await supabase
      .from("users_favorite_films")
      .select("*")
      .eq("user_id", userId)
      .order("position")

    if (error) {
      console.error("Erro ao sincronizar favoritos:", error)
      return
    }
    setSortableItems(buildSortableItemsFromFilms(favorites || []))
  }, [supabase, userId])

  useEffect(() => {
    const fetchFavoriteFilms = async () => {
      try {
        const { data: favorites, error: favError } = await supabase
          .from("users_favorite_films")
          .select("*")
          .eq("user_id", userId)
          .order("position")

        if (favError) {
          console.error("Erro ao buscar filmes favoritos:", favError)
          return
        }

        setSortableItems(buildSortableItemsFromFilms(favorites || []))
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavoriteFilms()
  }, [userId, supabase])

  const handleSortableChange = useCallback(
    (next: FavoriteSortableItem[]) => {
      setSortableItems(next)
      const films = filmsFromSortableItems(next)
      void (async () => {
        try {
          await persistFavoriteRows(films)
          await refetchFavorites()
        } catch (err) {
          console.error("Erro ao salvar ordem dos favoritos:", err)
        }
      })()
    },
    [persistFavoriteRows, refetchFavorites],
  )

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className="relative aspect-[2/3] h-full w-full rounded-[5px] border border-black/15 shadow-sm shadow-black/5 dark:border-white/15 dark:shadow-white/5"
          />
        ))}
      </div>
    )
  }

  if (favoriteFilms.length === 0 && !canEdit) return null

  if (!canEdit) {
    return (
      <>
        <h2 className="text-sm font-medium uppercase text-muted-foreground/50">Favorite Films</h2>
        <div className="mt-1 mb-4 h-[0.3px] w-full bg-muted-foreground/10" />

        <div className="grid grid-cols-4 gap-4">
          {favoriteFilms.map((film) => (
            <MovieCard
              key={film.film_id}
              movie={{
                id: film.film_id,
                title: film.title,
                poster_path: film.poster_path,
                vote_average: 0,
              }}
              externalid={film.film_id}
            />
          ))}
        </div>
      </>
    )
  }

  const handleFilmSelect = async (selectedMovie: Movie) => {
    if (!canEdit || !currentUser) return

    const filmId = selectedMovie.id

    try {
      const { data: existingFilms, error: checkError } = await supabase
        .from("users_favorite_films")
        .select("id")
        .eq("user_id", userId)
        .eq("position", selectedPosition)
        .maybeSingle()

      if (checkError) {
        console.error("Erro ao verificar filme existente:", checkError)
        return
      }

      if (existingFilms) {
        const { error: deleteError } = await supabase
          .from("users_favorite_films")
          .delete()
          .eq("id", existingFilms.id)

        if (deleteError) {
          console.error("Erro ao remover filme existente:", deleteError)
          return
        }
      }

      const { data: insertedFilm, error: insertError } = await supabase
        .from("users_favorite_films")
        .insert({
          user_id: userId,
          film_id: filmId,
          title: selectedMovie.title ?? "",
          poster_path: selectedMovie.poster_path ?? "",
          backdrop_path: selectedMovie.backdrop_path ?? "",
          release_date: selectedMovie.release_date ?? "",
          position: selectedPosition,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Erro ao inserir novo filme:", insertError)
        return
      }

      const { error: interactionError } = await supabase.from("items_interactions").upsert(
        {
          user_id: userId,
          tmdb_id: filmId,
          media_type: "movie",
          is_watched: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          poster_path: selectedMovie.poster_path,
        },
        {
          onConflict: "user_id,tmdb_id,media_type",
        },
      )

      if (interactionError) {
        console.error("Erro ao marcar filme como assistido:", interactionError)
      } else {
        onFilmAdded?.()
      }

      setSortableItems((prev) =>
        prev.map((cell, i) =>
          i === selectedPosition - 1
            ? { id: `film-${insertedFilm.id}`, film: insertedFilm }
            : cell,
        ),
      )

      setSelectedPosition(-1)
      setShowSearchCommand(false)
      setQuery("")
    } catch (error) {
      console.error("Error selecting film:", error)
    }
  }

  const handleRemoveFilm = async (film: Film) => {
    if (!canEdit || !currentUser) return

    try {
      const { error } = await supabase.from("users_favorite_films").delete().eq("id", film.id)

      if (error) {
        console.error("Erro ao remover filme:", error)
        return
      }

      setSortableItems((prev) =>
        prev.map((cell) =>
          cell.film?.id === film.id
            ? { id: `empty-${crypto.randomUUID()}`, film: null }
            : cell,
        ),
      )
    } catch (error) {
      console.error("Erro ao remover filme:", error)
    }
  }

  const handleSlotClick = (visualPosition: number) => {
    if (!canEdit) return
    setSelectedPosition(visualPosition)
    setQuery("")
    setShowSearchCommand(true)
  }

  /** Uma linha só; overflow-x em telas estreitas. Drag livre em X/Y via `modifiers={[]}` + orientation mixed. */
  const slotListClass =
    "m-0 flex min-w-0 list-none flex-row flex-nowrap gap-4 overflow-x-auto p-0 [scrollbar-width:thin]"

  return (
    <>
      <h2 className="text-sm font-medium uppercase text-muted-foreground/50">Favorite Films</h2>
      <div className="mt-1 mb-4 h-[0.3px] w-full bg-muted-foreground/10" />

      <Sortable
        value={sortableItems}
        onValueChange={handleSortableChange}
        getItemValue={(item) => item.id}
        orientation="mixed"
        modifiers={[]}
      >
        <SortableContent
          asChild
          className={slotListClass}
          strategy={horizontalListSortingStrategy}
        >
          <ul>
            {sortableItems.map((item, visualIdx) => (
              <FavoriteSortableRow
                key={item.id}
                item={item}
                onRemove={handleRemoveFilm}
                onSelectSlot={() => handleSlotClick(visualIdx + 1)}
                canEdit={canEdit}
              />
            ))}
          </ul>
        </SortableContent>
        <SortableOverlay>
          {({ value }) => {
            const active = sortableItems.find((s) => s.id === value)
            if (!active?.film) return null
            return <FavoriteSlotOverlay film={active.film} />
          }}
        </SortableOverlay>
      </Sortable>

      <CommandDialog open={showSearchCommand} onOpenChange={setShowSearchCommand}>
        <MediaSearchCommandContent
          query={query}
          onQueryChange={setQuery}
          filmResults={filmResults}
          seriesResults={seriesResults}
          loading={searchLoading}
          inputPlaceholder="Search"
          commandListClassName="custom-scrollbar max-h-[600px] h-full overflow-y-auto"
          onSelectFilm={(movie) => {
            void handleFilmSelect(movie)
          }}
          onSelectSeries={(series) => {
            window.open(`/series/${series.id}`, "_blank", "noopener,noreferrer")
          }}
          filmRowMode="pick"
          seriesRowMode="pick"
        />
      </CommandDialog>
    </>
  )
}

interface FavoriteSortableRowProps {
  item: FavoriteSortableItem
  onRemove: (film: Film) => void
  onSelectSlot: () => void
  canEdit: boolean
}

function FavoriteSortableRow({
  item,
  onRemove,
  onSelectSlot,
  canEdit,
}: FavoriteSortableRowProps) {
  const hasFilm = Boolean(item.film)

  return (
    <SortableItem value={item.id} asChild asHandle={hasFilm}>
      <li className="relative shrink-0 list-none">
        <div className="relative isolate">
          <FavoriteSlot
            film={item.film ?? undefined}
            onRemove={onRemove}
            onSelect={onSelectSlot}
            canEdit={canEdit}
          />
        </div>
      </li>
    </SortableItem>
  )
}
