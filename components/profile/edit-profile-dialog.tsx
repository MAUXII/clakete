import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@supabase/auth-helpers-react"
import { ImageEditDialog } from "./avatar-edit-dialog"
import { useProfile } from "@/components/providers/profile-provider"
import { LiaUserEditSolid } from "react-icons/lia"
import { Plus } from "lucide-react"
import { CommandDialog, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createPortal } from 'react-dom';

interface Film {
  id: number;         // ID do registro na tabela users_favorite_films
  film_id: number;    // ID do filme no TMDB
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  position: number;
  user_id?: string;   // ID do usuário (opcional pois já está no contexto)
}

interface SearchResult {
  id: number
  title: string
  poster_path: string
  backdrop_path: string
  release_date: string
}

interface EditProfileDialogProps {
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  favoriteFilms?: Film[];
  onUpdate: (updates: { 
    display_name?: string; 
    bio?: string; 
    avatar_url?: string; 
    banner_url?: string;
    favorite_films?: Film[];
  }) => void;
}

interface PosterSlotProps {
  film?: Film;
  position: number;
  onSelect: (position: number) => void;
  onRemove: (filmId: number) => void;
}

function PosterSlot({ film, position, onSelect, onRemove }: PosterSlotProps) {
  return (
    <div className="relative w-[150px] h-[225px] bg-card rounded-md overflow-hidden border group">
      {film ? (
        <>
          <img
            src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
            alt={film.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
          <button
            onClick={() => onRemove(film.film_id)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-white truncate">{film.title}</p>
          </div>
        </>
      ) : (
        <button
          onClick={() => onSelect(position)}
          className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-accent/50 transition-colors"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs text-muted-foreground">Add film</span>
        </button>
      )}
    </div>
  )
}

export function EditProfileDialog({ 
  username, 
  displayName, 
  bio, 
  avatarUrl,
  bannerUrl,
  favoriteFilms = [],
  onUpdate 
}: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(displayName || "")
  const [newBio, setNewBio] = useState(bio || "")
  const [selectedPosition, setSelectedPosition] = useState<number>(-1)
  const [selectedFilms, setSelectedFilms] = useState<Film[]>(favoriteFilms || [])
  const [results, setResults] = useState<SearchResult[]>([])
  const [query, setQuery] = useState("")
  const [showSearchCommand, setShowSearchCommand] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const user = useUser()
  const { refreshProfile } = useProfile()
  const supabase = useSupabaseClient()
  
  useEffect(() => {
    const fetchMovies = async () => {
      setIsSearching(true)
      try {
        let endpoint = ""
        if (debouncedQuery.trim().length === 0) {
          // Mostrar filmes mais bem avaliados de todos os tempos
          endpoint = "/api/movies?type=top_rated"
        } else {
          endpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`
        }
        const response = await fetch(endpoint)
        const data = await response.json()
        
        // Map results to include position if they're in selectedFilms
        const mappedResults = data.results ? data.results.map((movie: any) => {
          const { id, ...rest } = movie
          return {
            ...rest,
            id
          }
        }) : []
        
        setResults(mappedResults)
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
      } finally {
        setIsSearching(false)
      }
    }
    fetchMovies()
  }, [debouncedQuery, selectedFilms])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const loadFavoriteFilms = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users_favorite_films')
          .select('id, film_id, title, poster_path, backdrop_path, release_date, position')
          .eq('user_id', user.id)
          .order('position');
          
        if (error) {
          console.error('Erro ao carregar filmes favoritos:', error);
          return;
        }
        
        if (data) {
          setSelectedFilms(data);
        }
      } catch (error) {
        console.error('Erro ao carregar filmes favoritos:', error);
      }
    };
    
    if (isOpen) {
      loadFavoriteFilms();
    }
  }, [isOpen, user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Apenas atualizar os campos de perfil básicos
      const profileUpdates = {
        display_name: newDisplayName,
        bio: newBio,
      };

      // Atualizar o perfil básico (sem incluir favorite_films)
      await onUpdate(profileUpdates);
      
      // Não é necessário fazer nada com os filmes favoritos aqui,
      // pois eles já foram atualizados individualmente durante o drag and drop
      
      await refreshProfile();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (position: number) => {
    setSelectedPosition(position)
    setQuery('')
    setShowSearchCommand(true)
  }

  const handleFilmSelect = async (filmId: number) => {
    if (!user) return;

    try {
      // Verificar se já existe um filme nesta posição
      const { data: existingFilm, error: checkError } = await supabase
        .from('users_favorite_films')
        .select('id')
        .eq('user_id', user.id)
        .eq('position', selectedPosition)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, que é ok neste caso
        console.error('Erro ao verificar filme existente:', checkError);
        return;
      }
      
      // Se já existe um filme nesta posição, remova-o primeiro
      if (existingFilm) {
        const { error: deleteError } = await supabase
          .from('users_favorite_films')
          .delete()
          .eq('id', existingFilm.id);
        
        if (deleteError) {
          console.error('Erro ao remover filme existente:', deleteError);
          return;
        }
      }

      const selectedMovie = results.find(m => m.id === filmId);
      if (!selectedMovie) return;

      // Inserir o novo filme com a posição selecionada
      const { data: insertedFilm, error: insertError } = await supabase
        .from('users_favorite_films')
        .insert({
          user_id: user.id,
          film_id: filmId,
          title: selectedMovie.title,
          poster_path: selectedMovie.poster_path,
          backdrop_path: selectedMovie.backdrop_path || '',
          release_date: selectedMovie.release_date || '',
          position: selectedPosition
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao inserir novo filme:', insertError);
        return;
      }

      // Atualizar o estado local
      setSelectedFilms(prev => {
        // Remover qualquer filme existente nesta posição
        const filtered = prev.filter(f => f.position !== selectedPosition);
        
        // Adicionar o novo filme com todas as informações, incluindo o ID
        return [...filtered, insertedFilm];
      });

      setSelectedPosition(-1);
      setShowSearchCommand(false);
    } catch (error) {
      console.error('Error selecting film:', error);
    }
  };

  const handleRemoveFilm = async (film: Film) => {
    if (!user || !film) return;
    
    try {
      // Remover o filme pelo ID do registro
      const { error } = await supabase
        .from('users_favorite_films')
        .delete()
        .eq('id', film.id);
      
      if (error) {
        console.error('Erro ao remover filme:', error);
        return;
      }
      
      // Atualizar o estado local
      setSelectedFilms(prev => prev.filter(f => f.id !== film.id));
    } catch (error) {
      console.error('Erro ao remover filme:', error);
    }
  };

  const handleImageSave = (type: 'avatar' | 'banner') => async (url: string) => {
    try {
      await onUpdate({
        [`${type}_url`]: url
      })
      await refreshProfile()
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !user) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const sourcePosition = sourceIndex + 1;
    const destinationPosition = destinationIndex + 1;
    
    // Cria uma cópia do estado atual
    const updatedFilms = [...selectedFilms];
    
    // Encontra os filmes nas posições de origem e destino
    const sourceFilmIndex = updatedFilms.findIndex(f => f.position === sourcePosition);
    const destFilmIndex = updatedFilms.findIndex(f => f.position === destinationPosition);
    
    if (sourceFilmIndex === -1) return;
    
    try {
      // Abordagem de apagar e inserir novamente
      // 1. Remover todos os filmes do usuário
      await supabase
        .from('users_favorite_films')
        .delete()
        .eq('user_id', user.id);
      
      // 2. Atualizar as posições na cópia local
      const sourceFilm = updatedFilms[sourceFilmIndex];
      
      if (destFilmIndex !== -1) {
        // Se tem filme na posição de destino, troca as posições
        const destFilm = updatedFilms[destFilmIndex];
        
        // Troca as posições
        sourceFilm.position = destinationPosition;
        destFilm.position = sourcePosition;
      } else {
        // Se não tem filme na posição de destino, apenas move
        sourceFilm.position = destinationPosition;
      }
      
      // 3. Inserir todos novamente com as posições atualizadas
      const filmsToInsert = updatedFilms.map(film => ({
        user_id: user.id,
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
      
      // 4. Atualizar o estado local
      setSelectedFilms(updatedFilms);
      
    } catch (error) {
      console.error('Erro ao reordenar filmes:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="px-3 py-2 bg-[#FF0048]  rounded-md  transition-colors w-full bg-[#FF0048]/10 text-nowrap text-[#FF0048]/70 border border-black/10 dark:border-white/10 flex items-center justify-center">Edit Profile</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
            <TabsTrigger value="films">Favorite Films</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                placeholder={username}
                disabled
                className="mt-2"
              />
             
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Your display name"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This is the name that will be displayed on your profile
              </p>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="Tell us about yourself"
                className="mt-2"
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={`${username}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-medium">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <ImageEditDialog
              type="avatar"
              onSave={handleImageSave('avatar')}
              onClose={() => {}}
              onSelect={() => {}}
            />
          </TabsContent>

          <TabsContent value="banner" className="space-y-4">
            <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden">
              {bannerUrl ? (
                <img 
                  src={bannerUrl} 
                  alt="Profile banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No banner uploaded</p>
                </div>
              )}
            </div>
            <ImageEditDialog
              type="banner"
              onClose={() => {}}
              onSelect={() => {}}
              onSave={handleImageSave('banner')}
            />
          </TabsContent>

          <TabsContent value="films" className="space-y-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable 
                droppableId="favorite-films" 
                direction="horizontal" 
              >
                {(provided, snapshot) => (
                  <div 
                    className="grid grid-cols-4 gap-4 mt-6"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {Array.from({ length: 4 }).map((_, index) => {
                      const position = index + 1;
                      const film = selectedFilms.find(f => f.position === position);
                      
                      return (
                        <Draggable 
                          key={`film-slot-${position}`} 
                          draggableId={`film-slot-${position}`} 
                          index={index}
                          isDragDisabled={!film}
                        >
                          {(provided, snapshot) => {
                            const draggableStyle = {
                              ...provided.draggableProps.style,
                              top: snapshot.isDragging ? 0 : undefined,
                            };
                            
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`relative w-[150px] h-[225px] bg-card rounded-md overflow-hidden border group
                                  ${snapshot.isDragging ? 'z-50 shadow-md' : ''}`}
                                style={draggableStyle}
                              >
                                {film ? (
                                  <>
                                    <img
                                      src={`https://image.tmdb.org/t/p/w185${film.poster_path}`}
                                      alt={film.title}
                                      className={`w-full h-full object-cover ${
                                        snapshot.isDragging ? 'opacity-90' : 'transition-transform group-hover:scale-105'
                                      }`}
                                    />
                                    <div className={`absolute inset-0 ${
                                      snapshot.isDragging ? 'bg-black/30' : 'bg-black/0 group-hover:bg-black/40'
                                    } transition-colors`} />
                                    {!snapshot.isDragging && (
                                      <button
                                        onClick={() => handleRemoveFilm(film)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        ×
                                      </button>
                                    )}
                                    <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent ${
                                      snapshot.isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    } transition-opacity`}>
                                      <p className="text-xs text-white truncate">{film.title}</p>
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleSlotClick(position)}
                                    className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                                  >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-xs">Add Film</span>
                                  </button>
                                )}
                              </div>
                            );
                          }}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            <CommandDialog open={showSearchCommand} onOpenChange={setShowSearchCommand}>
              <CommandInput
                placeholder="Search"
                value={query}
                onValueChange={setQuery}
                className=""
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
                          setShowSearchCommand(false)
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}