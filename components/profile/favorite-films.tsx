"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { MovieCard } from "../movies/movie-card"
import { Plus } from "lucide-react"
import { CommandDialog } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch } from "@/hooks/use-media-search"
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
import { Skeleton } from "../ui/skeleton"

interface Film {
  id: number
  film_id: number
  title: string
  poster_path: string
  backdrop_path: string
  release_date: string
  position: number
}

interface FavoriteFilmsProps {
  userId: string
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
  film?: Film, 
  onRemove: (film: Film) => void, 
  onSelect: (position: number) => void,
  position: number,
  canEdit: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
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
    <>
 
    
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-[150px] cursor-move  h-[225px] bg-card rounded-md overflow-hidden border group
        ${isDragging ? 'cursor-move z-50 border border-[#fd85a7]/20 transition-colors' : ''}`}
      {...attributes}
      {...listeners}
    >
      
      {film ? (
        <ContextMenu>
          <ContextMenuTrigger>
          <img
            src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
            alt={film.title}
            className="w-full h-full object-cover "
          />
          
          
          <div className="absolute inset-0 " />
          </ContextMenuTrigger>
          {canEdit && (
            
            <ContextMenuContent className="w-full">
            <ContextMenuItem className="py-3 px-6 hover:bg-[#ff0048]/10 hover:dark:bg-[#ff0048]/10 hover:text-[#ff0048] hover:dark:text-[#ff0048] flex items-center gap-2" onClick={handleRemoveClick} onPointerUp={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            
           
           
           
              
              <MdDelete className="text-xl"/>
              <span className="">Delete favorite movie</span>
           
            </ContextMenuItem>
            </ContextMenuContent>
          )}
          
        </ContextMenu>
      ) : canEdit ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => onSelect(position)}>
          <Plus className="w-6 h-6" />
          <span className="text-xs">Add Film</span>
        </div>
      ) : null}
    </div>
    </>
  );
}

export function UserFavoriteFilms({ userId, isEditable = false, onFilmAdded }: FavoriteFilmsProps) {
  // 1. Todos os estados primeiro
  const [favoriteFilms, setFavoriteFilms] = useState<Film[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<number>(-1)
  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [query, setQuery] = useState("")
  const [draggedFilms, setDraggedFilms] = useState<Film[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // 2. Hooks de contexto e clientes
  const supabase = useSupabaseClient()
  const currentUser = useUser()
  const canEdit = isEditable || (currentUser?.id === userId)
  const debouncedQuery = useDebounce(query, 300)
  const { filmResults, seriesResults, loading: searchLoading } = useMediaSearch(
    debouncedQuery,
    showSearchCommand && canEdit
  )

  // 4. Todos os useEffects juntos
  // Efeito para buscar filmes favoritos
  useEffect(() => {
    const fetchFavoriteFilms = async () => {
      try {
        console.log("Buscando filmes favoritos para o usuário:", userId);
        const { data: favorites, error: favError } = await supabase
          .from('users_favorite_films')
          .select('*')
          .eq('user_id', userId)
          .order('position')

        if (favError) {
          console.error('Erro ao buscar filmes favoritos:', favError)
          return
        }

        console.log("Filmes favoritos encontrados:", favorites);
        setFavoriteFilms(favorites || [])
      } catch (error) {
        console.error('Erro ao buscar filmes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFavoriteFilms()
  }, [userId, supabase])

  // Efeito para sincronizar draggedFilms
  useEffect(() => {
    if (!isDragging) {
      setDraggedFilms(favoriteFilms);
    }
  }, [favoriteFilms, isDragging])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
  {[...Array(4)].map((_, i) => (
    <Skeleton key={i} className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden" />
  ))}
</div>
  
  // Se não há filmes e o usuário não pode editar, retorna uma mensagem
  if (favoriteFilms.length === 0 && !canEdit) return 

  // Modo de visualização (sem edição)
  if (!canEdit) {
    console.log("Renderizando filmes favoritos (modo visualização):", favoriteFilms);
  return (
      <>
         <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Favorite Films</h2>
         <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
      
      <div className="grid grid-cols-4 gap-4">
      {favoriteFilms.map((film) => (
          <MovieCard 
            key={film.film_id} 
            movie={{
              id: film.film_id,
              title: film.title,
              poster_path: film.poster_path,
              vote_average: 0 // Você pode adicionar isso se tiver essa informação
            }} 
            externalid={film.film_id} 
          />
        ))}
      </div>
      </>
    )
  }

  // Adicionar onDragStart
  const handleDragStart = () => {
    setIsDragging(true);
    // Capturar o estado atual para uso durante o drag
    setDraggedFilms([...favoriteFilms]);
  };

  // Modificar handleDragEnd
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !canEdit) {
      // Finalizar o drag
      setIsDragging(false);
      return;
    }
    
    // Extrair posições dos IDs
    const activeId = String(active.id);
    const overId = String(over.id);
    
    const fromPosition = parseInt(activeId.replace('position-', ''));
    const toPosition = parseInt(overId.replace('position-', ''));
    
    if (isNaN(fromPosition) || isNaN(toPosition)) {
      setIsDragging(false);
      return;
    }
    
    // Encontrar o filme na posição de origem
    const sourceFilm = draggedFilms.find(f => f.position === fromPosition);
    if (!sourceFilm) {
      setIsDragging(false);
      return;
    }
    
    // Criar cópia do estado atual para manipulação
    let updatedFilms = [...draggedFilms];
    
    // Aplicar a lógica de cascata
    if (fromPosition < toPosition) {
      // Movendo para a direita
      updatedFilms = updatedFilms.map(film => {
        if (film.position === fromPosition) {
          return { ...film, position: toPosition };
        } else if (film.position > fromPosition && film.position <= toPosition) {
          return { ...film, position: film.position - 1 };
        }
        return film;
      });
    } else {
      // Movendo para a esquerda
      updatedFilms = updatedFilms.map(film => {
        if (film.position === fromPosition) {
          return { ...film, position: toPosition };
        } else if (film.position >= toPosition && film.position < fromPosition) {
          return { ...film, position: film.position + 1 };
        }
        return film;
      });
    }
    
    // Atualizar o estado visual imediatamente
    setDraggedFilms(updatedFilms);
    
    // Também atualizar o estado oficial para manter consistência
    setFavoriteFilms(updatedFilms);
    
    // Desativar o modo de drag
    setIsDragging(false);
    
    // Atualizar banco de dados em segundo plano
    try {
      await supabase
        .from('users_favorite_films')
        .delete()
        .eq('user_id', userId);
      
      if (updatedFilms.length > 0) {
        const filmsToInsert = updatedFilms.map(film => ({
          user_id: userId,
          film_id: film.film_id,
          title: film.title,
          poster_path: film.poster_path,
          backdrop_path: film.backdrop_path || '',
          release_date: film.release_date || '',
          position: film.position
        }));
        
        await supabase
          .from('users_favorite_films')
          .insert(filmsToInsert);
      }
    } catch (error) {
      console.error('Erro ao reordenar filmes:', error);
    }
  };

  // Adicionar filme favorito (mesmo UI do media search; aqui o command fecha após escolher)
  const handleFilmSelect = async (selectedMovie: Movie) => {
    if (!canEdit || !currentUser) return

    const filmId = selectedMovie.id

    try {
      // Verificar se já existe um filme nesta posição
      const { data: existingFilms, error: checkError } = await supabase
        .from('users_favorite_films')
        .select('id')
        .eq('user_id', userId)
        .eq('position', selectedPosition)
        .maybeSingle()
      
      if (checkError) {
        console.error('Erro ao verificar filme existente:', checkError)
        return
      }
      
      // Se já existe um filme nesta posição, remova-o primeiro
      if (existingFilms) {
        const { error: deleteError } = await supabase
          .from('users_favorite_films')
          .delete()
          .eq('id', existingFilms.id)
        
        if (deleteError) {
          console.error('Erro ao remover filme existente:', deleteError)
          return
        }
      }

      // Inserir o novo filme com a posição selecionada
      const { data: insertedFilm, error: insertError } = await supabase
        .from('users_favorite_films')
        .insert({
          user_id: userId,
          film_id: filmId,
          title: selectedMovie.title ?? '',
          poster_path: selectedMovie.poster_path ?? '',
          backdrop_path: selectedMovie.backdrop_path ?? '',
          release_date: selectedMovie.release_date ?? '',
          position: selectedPosition
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro ao inserir novo filme:', insertError)
        return
      }

      // Adicionar o filme como assistido na tabela film_interactions
      const { error: interactionError } = await supabase
        .from('film_interactions')
        .upsert({
          user_id: userId,
          film_id: filmId,
          is_watched: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          poster_path: selectedMovie.poster_path,

        }, {
          onConflict: 'user_id,film_id'
        })

      if (interactionError) {
        console.error('Erro ao marcar filme como assistido:', interactionError)
      } else {
        // Notificar que um filme foi adicionado
        onFilmAdded?.()
      }

      // Atualizar o estado local
      setFavoriteFilms(prev => {
        // Remover qualquer filme existente nesta posição
        const filtered = prev.filter(f => f.position !== selectedPosition)
        
        // Adicionar o novo filme
        return [...filtered, insertedFilm]
      })

      setSelectedPosition(-1)
      setShowSearchCommand(false)
      setQuery("")
    } catch (error) {
      console.error('Error selecting film:', error)
    }
  }

  // Remover filme favorito
  const handleRemoveFilm = async (film: Film) => {
    if (!canEdit || !currentUser) return
    
    try {
      // Remover o filme do banco de dados
      const { error } = await supabase
        .from('users_favorite_films')
        .delete()
        .eq('id', film.id)
      
      if (error) {
        console.error('Erro ao remover filme:', error)
        return
      }
      
      // Atualizar o estado local
      setFavoriteFilms(prev => prev.filter(f => f.id !== film.id))
    } catch (error) {
      console.error('Erro ao remover filme:', error)
    }
  }

  // Abrir diálogo de pesquisa para adicionar filme
  const handleSlotClick = (position: number) => {
    if (!canEdit) return
    setSelectedPosition(position)
    setQuery('')
    setShowSearchCommand(true)
  }

  // Mudar os sortableIds para usar posições
  const sortableIds = Array.from({ length: 4 }, (_, i) => `position-${i + 1}`);

  return (
    <>
       <h2 className="font-medium text-muted-foreground/50 text-sm uppercase ">Favorite Films</h2>
       <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
      <DndContext 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          <SortableContext items={sortableIds}>
            {Array.from({ length: 4 }).map((_, index) => {
              const position = index + 1;
              // Usar draggedFilms durante o drag, favoriteFilms caso contrário
              const filmsToUse = isDragging ? draggedFilms : favoriteFilms;
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

      {/* Mesmo padrão do command das listas / media search (Films + Series, hover, + para slot) */}
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
