"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Database } from "@/lib/supabase/database.types"
import { List, ListFilm } from "@/types/list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, Eye, EyeOff, Calendar, Film, ArrowLeft, Trash2, Image } from "lucide-react"
import Link from "next/link"
import { useLists } from "@/hooks/use-lists"
import { CommandDialog, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { MovieCard } from "@/components/movies/movie-card"
import { IoEyeOutline, IoTrashOutline } from "react-icons/io5";

interface SearchResult {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  release_date: string
}

export default function ListDetailPage() {
  const params = useParams()
  const listId = params.id as string
  const supabase = useSupabaseClient<Database>()
  const currentUser = useUser()
  const { fetchListFilms, addFilmToList, removeFilmFromList, updateList } = useLists()
  
  const [list, setList] = useState<List | null>(null)
  const [films, setFilms] = useState<ListFilm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para adicionar filmes
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  // Estados para edição do banner
  const [showBannerEdit, setShowBannerEdit] = useState(false)

  // Verificar se o usuário pode editar a lista
  const canEdit = currentUser?.id === list?.user_id

  console.log('Debug - canEdit:', canEdit, 'currentUser:', currentUser?.id, 'list?.user_id:', list?.user_id);

  useEffect(() => {
    const fetchListData = async () => {
      if (!listId) return

      try {
        setLoading(true)
        setError(null)

        // Buscar dados da lista
        const { data: listData, error: listError } = await supabase
          .from('lists')
          .select('*')
          .eq('id', listId)
          .single()

        if (listError) throw listError

        if (listData) {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('username, display_name, avatar_url')
            .eq('id', listData.user_id)
            .single()

          // Buscar filmes da lista
          const { data: filmsData, error: filmsError } = await supabase
            .from('list_films')
            .select('*')
            .eq('list_id', listId)
            .order('position')

          if (filmsError) throw filmsError

          setList({
            ...listData,
            userData: userData || undefined,
            films_count: filmsData?.length || 0
          })
          setFilms(filmsData || [])
        }
      } catch (error) {
        console.error('Erro ao carregar lista:', error)
        setError('Erro ao carregar lista')
      } finally {
        setLoading(false)
      }
    }

    fetchListData()
  }, [listId, supabase])

  // Efeito para buscar resultados de pesquisa
  useEffect(() => {
    const fetchMovies = async () => {
      if (!canEdit) return
      
      setIsSearching(true)
      try {
        let endpoint = ""
        if (debouncedQuery.trim().length === 0) {
          endpoint = "/api/movies?type=top_rated"
        } else {
          endpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`
        }
        const response = await fetch(endpoint)
        const data = await response.json()
        
        setResults(data.results || [])
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
      } finally {
        setIsSearching(false)
      }
    }
    
    if (showSearchDialog) {
      fetchMovies()
    }
  }, [debouncedQuery, showSearchDialog, canEdit])

  // Adicionar filme à lista
  const handleFilmSelect = async (filmId: number) => {
    if (!canEdit || !currentUser || !listId) return

    try {
      const selectedMovie = results.find(m => m.id === filmId)
      if (!selectedMovie) return

      // Encontrar a próxima posição disponível
      const nextPosition = films.length + 1

      // Adicionar o filme à lista
      const success = await addFilmToList(listId, {
        film_id: filmId,
        title: selectedMovie.title,
        poster_path: selectedMovie.poster_path,
        release_date: selectedMovie.release_date,
        position: nextPosition
      })

      if (success) {
        // Atualizar a lista local
        const newFilm: ListFilm = {
          id: '', // Será gerado pelo banco
          list_id: listId,
          film_id: filmId,
          title: selectedMovie.title,
          poster_path: selectedMovie.poster_path,
          release_date: selectedMovie.release_date,
          position: nextPosition,
          added_at: new Date().toISOString()
        }

        setFilms(prev => [...prev, newFilm])
        setList(prev => prev ? { ...prev, films_count: (prev.films_count || 0) + 1 } : null)
      }

      setShowSearchDialog(false)
      setQuery('')
    } catch (error) {
      console.error('Erro ao adicionar filme:', error)
    }
  }

  // Remover filme da lista
  const handleRemoveFilm = async (film: ListFilm) => {
    if (!canEdit || !currentUser) return
    
    try {
      const success = await removeFilmFromList(listId, film.film_id)
      
      if (success) {
        // Atualizar a lista local
        setFilms(prev => prev.filter(f => f.id !== film.id))
        setList(prev => prev ? { ...prev, films_count: Math.max(0, (prev.films_count || 0) - 1) } : null)
      }
    } catch (error) {
      console.error('Erro ao remover filme:', error)
    }
  }

  // Atualizar banner da lista
  const handleBannerUpdate = async (bannerUrl: string) => {
    if (!canEdit || !listId) {
      console.error('Não pode editar ou listId não encontrado');
      return;
    }
    
    try {
      console.log('🔄 Atualizando banner da lista:', listId, 'com URL:', bannerUrl);
      
      const success = await updateList(listId, { backdrop_path: bannerUrl });
      
      if (success) {
        console.log('✅ Banner atualizado com sucesso no banco de dados');
        setList(prev => prev ? { ...prev, backdrop_path: bannerUrl } : null);
      } else {
        console.error('❌ Falha ao atualizar banner no banco de dados');
        throw new Error('Falha ao atualizar banner no banco de dados');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar banner:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem do erro:', error instanceof Error ? error.message : 'Erro desconhecido');
      throw error; // Re-throw para o ImageEditDialog capturar
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <div className="h-20 w-14 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lista não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A lista que você está procurando não existe ou foi removida.
          </p>
          <Link href="/lists">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lists
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
             {/* Banner da lista */}
       <div className="mb-8">
         <div 
           className="w-full h-[450px] border dark:border-white/20 border-black/20 rounded-lg bg-cover bg-center relative group"
           style={{ 
             backgroundImage: `url(${list.backdrop_path || '/wavebg.png'})`,
             backgroundPosition: 'center 20%'
           }}
         >
           {canEdit && (
             <div className="absolute z-10 inset-0 flex items-center justify-center">
               <button 
                 onClick={() => setShowBannerEdit(true)}
                 className="backdrop-blur-[1.2px] rounded-lg cursor-pointer flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2"
               >
                 <span className="text-white flex items-center gap-2">
                   <Image className="h-4 w-4" />
                   {list.backdrop_path ? 'Atualizar Banner' : 'Adicionar Banner'}
                 </span>
               </button>
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
         </div>
       </div>

      {/* Header */}
      <div className="mb-8">
        <Link href="/lists" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lists
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">{list.title}</h1>
        
        {list.bio && (
          <p className="text-muted-foreground mb-4">{list.bio}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>{films.length} filmes</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(list.updated_at).toLocaleDateString()}</span>
          </div>
          {list.is_public ? (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Pública</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <EyeOff className="h-4 w-4" />
              <span>Privada</span>
            </div>
          )}
        </div>

        {/* Informações do criador */}
        <div className="flex items-center gap-2 mt-4">
          <Link href={`/${list.userData?.username}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={list.userData?.avatar_url || undefined} alt={list.userData?.display_name || list.userData?.username || ''} />
              <AvatarFallback className="text-sm font-medium">
                {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/${list.userData?.username}`} className="text-sm text-muted-foreground hover:text-[#e94e7a] transition-colors">
            {list.userData?.display_name || list.userData?.username}
          </Link>
        </div>

      </div>

      {/* Lista de filmes */}
      <div className="space-y-4">
        {films.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Esta lista ainda não tem filmes.</p>
            {canEdit && (
              <Button
                onClick={() => setShowSearchDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro filme
              </Button>
            )}
          </div>
        ) : (
          <>
              {/* Botão de adicionar filme */}
        {canEdit && films.length > 0 && (
              <Button
                onClick={() => setShowSearchDialog(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar mais filmes
              </Button>
            )}
         
          <div className="grid grid-cols-5 gap-4 w-full">
            
          {films.map((film, index) => (
            
              
              
              
              
        
     <div key={film.id} className="flex items-end justify-end gap-2 group relative">
          <MovieCard 
            key={film.film_id} 
            movie={{
              id: film.film_id,
              title: film.title,
              poster_path: film.poster_path || null,
              vote_average: 0 // Você pode adicionar isso se tiver essa informação
            }} 
            externalid={film.film_id} 
          />
       {canEdit && (
        <div className="absolute flex flex-col gap-2 bottom-2 right-2">
           
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFilm(film)}
                      className="opacity-0 group-hover:opacity-100 duration-300 transition-opacity  rounded-md p-2 group border  bg-secondary text-white border-transparent hover:bg-[#280F16] hover:text-[#FF0048] hover:border-[#FF0048]/20" 
                      title="Remover filme"
                      
                    >
                      <IoTrashOutline className="h-4 w-4" />
                    </Button>
    </div>
     
                  )}
                 
        </div>
      
                  
                  
                 
           
      
          ))}
          </div>
          </>
        )}
        
        
      </div>

      {/* Dialog para pesquisa e seleção de filmes */}
      <CommandDialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <CommandInput
          placeholder="Search for films"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="h-full max-h-[600px] overflow-y-auto custom-scrollbar">
          {isSearching && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!isSearching && results.length === 0 && query && (
            <CommandEmpty>Nenhum filme encontrado.</CommandEmpty>
          )}
          {!isSearching && results.length > 0 && (
            <CommandGroup className="gap-2" heading="Select a film">
              {results.map((movie) => (
                <CommandItem 
                  key={movie.id}
                  className="my-4 mx-3"
                  style={{ padding: '0px' }}
                  value={movie.title || ""}
                  onSelect={() => {
                    handleFilmSelect(movie.id)
                    setShowSearchDialog(false)
                  }}
                >
                  <div className="flex flex-col w-full items-center relative">
                    {movie.backdrop_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`}
                        alt={movie.title || ""}
                        className="h-48 w-full object-cover rounded"
                      />
                    ) : movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342/${movie.poster_path}`}
                        alt={movie.title || ""}
                        className="h-48 w-full object-cover rounded"
                      />
                    ) : (
                      <div className="h-48 w-full bg-muted rounded flex items-center justify-center">
                        <span className="text-muted-foreground">Sem imagem disponível</span>
                      </div>
                    )}
                    <div className="absolute inset-0 rounded bg-black/60 flex items-center justify-center p-4">
                      <p className="font-bold text-center text-white">{movie.title}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

             {/* Dialog para edição do banner */}
      {showBannerEdit && (
        <ImageEditDialog
          open={showBannerEdit}
          onOpenChange={setShowBannerEdit}
          onSave={async (imageUrl: string) => {
            try {
              await updateList(listId, { backdrop_path: imageUrl })
              setList(prev => prev ? { ...prev, backdrop_path: imageUrl } : null)
              setShowBannerEdit(false)
            } catch (error) {
              console.error('Erro ao atualizar banner:', error)
            }
          }}
          type="banner"
          onClose={() => setShowBannerEdit(false)}
          onSelect={() => {}}
        />
      )}
    </div>
  )
} 