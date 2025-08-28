"use client"

import { useEffect, useState } from "react"
import { useUser } from "@supabase/auth-helpers-react"
import { ListFilm } from "@/types/list"
import { MovieCard } from "../movies/movie-card"
import Image from "next/image"
import { Plus } from "lucide-react"
import { CommandDialog, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
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

interface SearchResult {
  id: number
  title: string
  poster_path: string
  backdrop_path?: string
  release_date?: string
}

interface ListFilmsManagerProps {
  listId: number
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
  film?: ListFilm, 
  onRemove: (film: ListFilm) => void, 
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
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">{film.title}</p>
                {film.release_date && (
                  <p className="text-white/70 text-xs">{new Date(film.release_date).getFullYear()}</p>
                )}
              </div>
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
  const [listFilms, setListFilms] = useState<ListFilm[]>([])

  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [draggedFilms, setDraggedFilms] = useState<ListFilm[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const currentUser = useUser()
  const { fetchListFilms, addFilmToList, removeFilmFromList, reorderListFilms } = useLists()
  const debouncedQuery = useDebounce(query, 300)

  // Determina se o usuário atual pode editar os filmes da lista
  const canEdit = isEditable

  // Buscar filmes da lista
  useEffect(() => {
    const loadListFilms = async () => {
      try {
        const films = await fetchListFilms(listId.toString())
        setListFilms(films)
      } catch (error) {
        console.error('Erro ao carregar filmes da lista:', error)
      }
    }

    loadListFilms()
  }, [listId, fetchListFilms])

  // Sincronizar draggedFilms
  useEffect(() => {
    if (!isDragging) {
      setDraggedFilms(listFilms);
    }
  }, [listFilms, isDragging])

  // Buscar filmes baseado na query
  useEffect(() => {
    const searchMovies = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch(`/api/movies/search?query=${encodeURIComponent(debouncedQuery)}`)
        const data = await response.json()
        setResults(data.results || [])
      } catch (error) {
        console.error('Erro ao buscar filmes:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    searchMovies()
  }, [debouncedQuery])

  // Modo de visualização (sem edição)
  if (!canEdit) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {listFilms.map((film) => (
          <MovieCard 
            key={film.film_id} 
            movie={{
              id: film.film_id,
              title: film.title,
              poster_path: film.poster_path || '',
              vote_average: 0
            }} 
            externalid={film.film_id} 
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
      await reorderListFilms(listId.toString(), updatedFilms);
    } catch (error) {
      console.error('Erro ao reordenar filmes:', error);
    }
  };

  // Adicionar filme à lista
  const handleFilmSelect = async (filmId: number) => {
    if (!canEdit || !currentUser) return

    try {
      const selectedMovie = results.find(m => m.id === filmId)
      if (!selectedMovie) return

      // Encontrar a próxima posição disponível
      const nextPosition = listFilms.length > 0 
        ? Math.max(...listFilms.map(f => f.position)) + 1 
        : 1

      const success = await addFilmToList(listId.toString(), {
        film_id: filmId,
        title: selectedMovie.title,
        poster_path: selectedMovie.poster_path,
        release_date: selectedMovie.release_date || '',
        position: nextPosition
      })

      if (success) {
        // Atualizar estado local
        const newFilm: ListFilm = {
          id: Date.now().toString(), // ID temporário
          list_id: listId.toString(),
          film_id: filmId,
          title: selectedMovie.title,
          poster_path: selectedMovie.poster_path,
          release_date: selectedMovie.release_date || undefined,
          position: nextPosition,
          added_at: new Date().toISOString()
        }

        setListFilms(prev => [...prev, newFilm])
        onFilmAdded?.()
      }

      
      setShowSearchCommand(false)
    } catch (error) {
      console.error('Error selecting film:', error)
    }
  }

  // Remover filme da lista
  const handleRemoveFilm = async (film: ListFilm) => {
    if (!canEdit || !currentUser) return
    
    try {
      const success = await removeFilmFromList(listId.toString(), film.film_id)
      
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

      {/* Dialog para pesquisa e seleção de filmes */}
      <CommandDialog open={showSearchCommand} onOpenChange={setShowSearchCommand}>
        <CommandInput 
          placeholder="Buscar filmes..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? "Buscando..." : "Nenhum filme encontrado."}
          </CommandEmpty>
          <CommandGroup>
            {results.map((movie) => (
              <CommandItem
                key={movie.id}
                onSelect={() => handleFilmSelect(movie.id)}
                className="flex items-center gap-2"
              >
                <Image 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/placeholder.png'}
                  alt={movie.title}
                  width={32}
                  height={48}
                  className="w-8 h-12 object-cover rounded"
                />
                <div>
                  <div className="font-medium">{movie.title}</div>
                  {movie.release_date && (
                    <div className="text-sm text-muted-foreground">
                      {new Date(movie.release_date).getFullYear()}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
} 