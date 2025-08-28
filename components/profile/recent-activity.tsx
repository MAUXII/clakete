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

interface RecentActivityProps {
  userId: string
  showAllWatched?: boolean
}

export function UserRecentActivity({ userId, showAllWatched }: RecentActivityProps) {
  const [watchedFilms, setWatchedFilms] = useState<FilmInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()
  
  const [visibleCount, setVisibleCount] = useState(showAllWatched ? 999 : 12); // Show all if showAllWatched is true
  
  const { rive, RiveComponent } = useRive({
    src: '/cat1.riv',
    artboard: 'Artboard',
    stateMachines: ['State Machine 1'],
    autoplay: true,
    
   
  })

  useEffect(() => {
    if (rive) {
      console.log('Rive instance:', rive)

      // Listar todas as state machines disponíveis
      const machines = rive.stateMachineNames
      console.log('Available State Machines:', machines)

      // Para cada state machine, listar seus inputs
      machines.forEach(machine => {
        console.log(`\nState Machine: ${machine}`)
        const inputs = rive.stateMachineInputs(machine)
        console.log('Available Inputs:', inputs?.map(input => ({
          name: input.name,
          type: input.type
        })))
      })
    }
  }, [rive])

  const handleSeeMore = () => {
    setVisibleCount(watchedFilms.length); // Show all cast members
  };

  useEffect(() => {
    const fetchWatchedFilms = async () => {
      try {
        console.log('Buscando filmes assistidos para o usuário:', userId)
        
        const { data: interactions, error: interactionsError } = await supabase
          .from('film_interactions')
          .select('id, film_id, poster_path, created_at')
          .eq('user_id', userId)
          .eq('is_watched', true)
          .order('created_at', { ascending: false })
          

        if (interactionsError) {
          console.error('Erro ao buscar interações:', interactionsError)
          toast.error('Erro ao carregar filmes assistidos')
          return
        }

        if (!interactions || interactions.length === 0) {
          console.log('Nenhum filme assistido encontrado')
          setWatchedFilms([])
          return
        }

        console.log('Filmes encontrados:', interactions)
        setWatchedFilms(interactions)
      } catch (error) {
        console.error('Erro ao buscar filmes:', error)
        toast.error('Erro ao carregar filmes assistidos')
      } finally {
        setLoading(false)
      }
    }

    fetchWatchedFilms()
  }, [userId, supabase])

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
  {[...Array(12)].map((_, i) => (
    <Skeleton key={i} className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden" />
  ))}
</div>

  if (watchedFilms.length === 0) {
    return <div className="mt-4">
        <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">{showAllWatched ? 'Watched' : 'Recent Activity'}</h2>
        <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
        <div className="text-center overflow-clip flex justify-between items-start text-muted-foreground w-full">
        <p className="w-full text-start">{showAllWatched ? 'No films watched yet' : 'No Activity'}</p>
          <RiveComponent  width={400} className="flex invisible w-[222px] pl-9 h-20" /> 
          
        </div>
      </div>
  }

  return (
    <div className="mt-4">
      <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">{showAllWatched ? 'Watched' : 'Recent Activity'}</h2>
      <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
      <div className="grid grid-cols-4 gap-4">
        {watchedFilms.slice(0, visibleCount).map((film) => (
          <MovieCard
            key={film.film_id}
            movie={{
              id: film.film_id,
              title: "", // O título não é mais necessário aqui
              poster_path: film.poster_path,
              vote_average: 0
            }}
            externalid={film.film_id}
          />
        ))}
        
      </div>
      {!showAllWatched && visibleCount < watchedFilms.length && (
          <div className="mt-2 items-center justify-center w-full flex">
            <button
              onClick={handleSeeMore}
              className="bg-[#FF0048]/10 text-[#FF0048] p-3 w-full rounded-md border border-black/10 dark:border-white/10  hover:bg-[#FF0048]/20 hover:text-[#FF0048]/90 transition-all h-12 aspect-square flex items-center justify-center"
            >
              + See more
            </button>
          </div>
        )}
    </div>
  )
} 