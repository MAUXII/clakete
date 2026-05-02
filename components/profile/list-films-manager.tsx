"use client"

import { useEffect, useState } from "react"
import { useUser } from "@supabase/auth-helpers-react"
import { ListItem } from "@/types/list"
import { MovieCard } from "../movies/movie-card"
import Image from "next/image"
import { Plus } from "lucide-react"
import { CommandDialog } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch, type SeriesSearchResult } from "@/hooks/use-media-search"
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content"
import type { Movie } from "@/lib/tmdb/client"
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MdDelete } from "react-icons/md"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useLists } from "@/hooks/use-lists"

interface ListFilmsManagerProps {
  /** UUID da lista no Supabase */
  listId: string | number
  isEditable?: boolean
  onFilmAdded?: () => void
}

function SortableFilm({ 
  film, 
  onRemove, 
  onSelect, 
  position, 
  canEdit 
}: { 
  film?: ListItem, 
  onRemove: (film: ListItem) => void, 
  onSelect: (position: number) => void,
  position: number,
  canEdit: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: `position-${position}`,
    disabled: !film,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (film) {
      onRemove(film);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          style={style}
          className={`relative w-[150px] cursor-move h-[225px] bg-card rounded-md overflow-hidden border group
            ${isDragging ? 'cursor-move z-50 border border-[#fd85a7]/20 transition-colors' : ''}`}
          {...attributes}
          {...listeners}
        >
          {film ? (
            <>
              <Image 
                src={film.poster_path ? `https://image.tmdb.org/t/p/w300${film.poster_path}` : '/placeholder.png'}
                alt={film.title}
                width={300}
                height={450}
                className="h-full w-full object-cover"
              />
              {canEdit && (
                <button
                  onClick={handleRemoveClick}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MdDelete className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <div 
              className="h-full w-full flex flex-col items-center justify-center bg-muted hover:bg-muted/80 transition-colors cursor-pointer"
              onClick={() => onSelect(position)}
            >
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground text-center">Adicionar filme</span>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      {canEdit && film && (
        <ContextMenuContent>
          <ContextMenuItem onClick={handleRemoveClick}>
            Remover da lista
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}

export function ListFilmsManager({ listId, isEditable = false, onFilmAdded }: ListFilmsManagerProps) {
  const [listFilms, setListFilms] = useState<ListItem[]>([])

  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [query, setQuery] = useState("")
  const [draggedFilms, setDraggedFilms] = useState<ListItem[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const currentUser = useUser()
  const { fetchListItems, addItemToList, removeItemFromList, reorderListItems } = useLists()
  const debouncedQuery = useDebounce(query, 300)
  const { filmResults, seriesResults, loading } = useMediaSearch(debouncedQuery, showSearchCommand)

  // Determina se o usuário atual pode editar os filmes da lista
  const canEdit = isEditable

  // Buscar filmes da lista
  useEffect(() => {
    const loadListFilms = async () => {
      try {
        const films = await fetchListItems(listId.toString())
        setListFilms(films)
      } catch (error) {
        console.error('Erro ao carregar filmes da lista:', error)
      }
    }

    loadListFilms()
  }, [listId, fetchListItems])

  // Sincronizar draggedFilms
  useEffect(() => {
    if (!isDragging) {
      setDraggedFilms(listFilms);
    }
  }, [listFilms, isDragging])

  // Modo de visualização (sem edição)
  if (!canEdit) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {listFilms.map((film) => (
          <MovieCard 
            key={film.tmdb_id} 
            movie={{
              id: film.tmdb_id,
              title: film.title,
              poster_path: film.poster_path || '',
              vote_average: 0
            }} 
            externalid={film.tmdb_id} 
          />
        ))}
      </div>
    )
  }

  // Adicionar onDragStart
  const handleDragStart = () => {
    setIsDragging(true);
    setDraggedFilms([...listFilms]);
  };

  // Modificar handleDragEnd
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !canEdit) {
      setIsDragging(false);
      return;
    }
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    const fromPosition = parseInt(activeId.replace('position-', ''));
    const toPosition = parseInt(overId.replace('position-', ''));
    
    if (isNaN(fromPosition) || isNaN(toPosition)) {
      setIsDragging(false);
      return;
    }
    
    const sourceFilm = draggedFilms.find(f => f.position === fromPosition);
    if (!sourceFilm) {
      setIsDragging(false);
      return;
    }
    
    let updatedFilms = [...draggedFilms];
    
    // Aplicar a lógica de cascata
    if (fromPosition < toPosition) {
      updatedFilms = updatedFilms.map(film => {
        if (film.position === fromPosition) {
          return { ...film, position: toPosition };
        } else if (film.position > fromPosition && film.position <= toPosition) {
          return { ...film, position: film.position - 1 };
        }
        return film;
      });
    } else {
      updatedFilms = updatedFilms.map(film => {
        if (film.position === fromPosition) {
          return { ...film, position: toPosition };
        } else if (film.position >= toPosition && film.position < fromPosition) {
          return { ...film, position: film.position + 1 };
        }
        return film;
      });
    }
    
    setDraggedFilms(updatedFilms);
    setListFilms(updatedFilms);
    setIsDragging(false);
    
    // Atualizar banco de dados
    try {
      await reorderListItems(listId.toString(), updatedFilms);
    } catch (error) {
      console.error('Erro ao reordenar filmes:', error);
    }
  };

  // Adicionar filme à lista
  const handleFilmSelect = async (selectedMovie: Movie) => {
    if (!canEdit || !currentUser) return

    try {
      const filmId = selectedMovie.id

      // Encontrar a próxima posição disponível
      const nextPosition = listFilms.length > 0 
        ? Math.max(...listFilms.map(f => f.position)) + 1 
        : 1

      const success = await addItemToList(String(listId), {
        tmdb_id: filmId,
        title: selectedMovie.title ?? "",
        poster_path: selectedMovie.poster_path ?? undefined,
        release_date: selectedMovie.release_date || "",
        position: nextPosition,
        media_type: "movie",
      })

      if (success) {
        // Atualizar estado local
        const newFilm: ListItem = {
          id: Date.now().toString(), // ID temporário
          list_id: String(listId),
          tmdb_id: filmId,
          title: selectedMovie.title ?? "",
          poster_path: selectedMovie.poster_path ?? undefined,
          release_date: selectedMovie.release_date || undefined,
          position: nextPosition,
          added_at: new Date().toISOString(),
          media_type: "movie",
        }

        setListFilms(prev => [...prev, newFilm])
        onFilmAdded?.()
      }
    } catch (error) {
      console.error('Error selecting film:', error)
    }
  }

  const handleSeriesSelect = async (series: SeriesSearchResult) => {
    if (!canEdit || !currentUser) return

    try {
      const nextPosition =
        listFilms.length > 0 ? Math.max(...listFilms.map((f) => f.position)) + 1 : 1

      const success = await addItemToList(String(listId), {
        tmdb_id: series.id,
        title: series.name ?? "",
        poster_path: series.poster_path ?? undefined,
        release_date: series.first_air_date || "",
        position: nextPosition,
        media_type: "tv",
      })

      if (success) {
        const newItem: ListItem = {
          id: Date.now().toString(),
          list_id: String(listId),
          tmdb_id: series.id,
          title: series.name ?? "",
          poster_path: series.poster_path ?? undefined,
          release_date: series.first_air_date || undefined,
          position: nextPosition,
          added_at: new Date().toISOString(),
          media_type: "tv",
        }

        setListFilms((prev) => [...prev, newItem])
        onFilmAdded?.()
      }
    } catch (error) {
      console.error("Error selecting series:", error)
    }
  }

  // Remover filme da lista
  const handleRemoveFilm = async (film: ListItem) => {
    if (!canEdit || !currentUser) return
    
    try {
      const success = await removeItemFromList(String(listId), film.tmdb_id, film.media_type ?? "movie")
      
      if (success) {
        setListFilms(prev => prev.filter(f => f.id !== film.id))
      }
    } catch (error) {
      console.error('Erro ao remover filme:', error)
    }
  }

  // Abrir diálogo de pesquisa para adicionar filme
  const handleSlotClick = (position: number) => {
    if (!canEdit) return
    
    setQuery('')
    setShowSearchCommand(true)
  }

  // Gerar IDs para drag and drop
  const maxFilms = Math.max(listFilms.length + 10, 20) // Permitir até 20 filmes
  const sortableIds = Array.from({ length: maxFilms }, (_, i) => `position-${i + 1}`);

  return (
    <>
      <DndContext 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          <SortableContext items={sortableIds}>
            {Array.from({ length: maxFilms }).map((_, index) => {
              const position = index + 1;
              const filmsToUse = isDragging ? draggedFilms : listFilms;
              const film = filmsToUse.find(f => f.position === position);
              
              return (
                <SortableFilm
                  key={`position-${position}`}
                  film={film}
                  position={position}
                  onRemove={handleRemoveFilm}
                  onSelect={handleSlotClick}
                  canEdit={canEdit}
                />
              );
            })}
          </SortableContext>
        </div>
      </DndContext>

      {/* Dialog: mesmo layout do Search (Films + Series); série abre a página da série */}
      <CommandDialog open={showSearchCommand} onOpenChange={setShowSearchCommand}>
        <MediaSearchCommandContent
          query={query}
          onQueryChange={setQuery}
          filmResults={filmResults}
          seriesResults={seriesResults}
          loading={loading}
          onSelectFilm={(movie) => {
            void handleFilmSelect(movie)
          }}
          onSelectSeries={(series) => {
            void handleSeriesSelect(series)
          }}
          filmRowMode="pick"
          seriesRowMode="pick"
        />
      </CommandDialog>
    </>
  )
} 