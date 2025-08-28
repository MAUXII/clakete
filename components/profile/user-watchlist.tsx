"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { MovieCard } from "../movies/movie-card"
import { toast } from "sonner"
import { Skeleton } from "../ui/skeleton"
import { useRive } from "@rive-app/react-canvas"

interface FilmInteraction {
  id: number
  film_id: number
  poster_path: string
  created_at: string
}

interface UserWatchlistProps {
  userId: string
}

export function UserWatchlist({ userId }: UserWatchlistProps) {
  const [watchlistFilms, setWatchlistFilms] = useState<FilmInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()
  
  const { RiveComponent } = useRive({
    src: '/cat1.riv',
    artboard: 'Artboard',
    stateMachines: ['State Machine 1'],
    autoplay: true,
  })

  useEffect(() => {
    const fetchWatchlistFilms = async () => {
      try {
        console.log('Buscando filmes da watchlist para o usuário:', userId)
        
        const { data: interactions, error: interactionsError } = await supabase
          .from('film_interactions')
          .select('id, film_id, poster_path, created_at')
          .eq('user_id', userId)
          .eq('in_watchlist', true)
          .order('created_at', { ascending: false })

        if (interactionsError) {
          console.error('Erro ao buscar watchlist:', interactionsError)
          toast.error('Erro ao carregar watchlist')
          return
        }

        if (!interactions || interactions.length === 0) {
          console.log('Nenhum filme na watchlist encontrado')
          setWatchlistFilms([])
          return
        }

        console.log('Filmes da watchlist encontrados:', interactions)
        setWatchlistFilms(interactions)
      } catch (error) {
        console.error('Erro ao buscar watchlist:', error)
        toast.error('Erro ao carregar watchlist')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchWatchlistFilms()
    }
  }, [userId, supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden" />
        ))}
      </div>
    )
  }

  if (watchlistFilms.length === 0) {
    return (
      <div className="mt-4">
        <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Watchlist</h2>
        <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
        <div className="text-center overflow-clip flex justify-between items-start text-muted-foreground w-full">
          <p className="w-full text-start">No films in watchlist yet</p>
          <RiveComponent width={400} className="flex w-[222px] pl-9 h-20" /> 
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Watchlist</h2>
      <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
      <div className="grid grid-cols-4 gap-4">
        {watchlistFilms.map((film) => (
          <MovieCard
            key={film.film_id}
            movie={{
              id: film.film_id,
              title: "",
              poster_path: film.poster_path,
              vote_average: 0
            }}
            externalid={film.film_id}
          />
        ))}
      </div>
    </div>
  )
} 