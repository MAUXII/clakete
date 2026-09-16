"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { MovieCard } from "../movies/movie-card"
import { SeriesCard } from "../series/series-card"
import { toast } from "sonner"
import { Skeleton } from "../ui/skeleton"
import { ProfileSectionHeader } from "@/components/profile/profile-section-header"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"

interface FilmInteraction {
  id: number
  tmdb_id: number
  poster_path: string
  created_at: string
}

interface UserWatchlistProps {
  userId: string
}

export function UserWatchlist({ userId }: UserWatchlistProps) {
  const { t } = useT()
  const isGlass = useDesignMode() === "glass"
  const [watchlistFilms, setWatchlistFilms] = useState<FilmInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  useEffect(() => {
    const fetchWatchlistFilms = async () => {
      try {
        console.log('Buscando filmes da watchlist para o usuário:', userId)
        
        const { data: interactions, error: interactionsError } = await supabase
          .from('items_interactions')
          .select('id, tmdb_id, poster_path, created_at')
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
      <div className="mt-4">
        <ProfileSectionHeader title={t("profile.watchlist")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="relative aspect-[2/3] h-full w-full overflow-hidden rounded-[5px] border border-black/15 shadow-sm shadow-black/5 dark:border-white/15 dark:shadow-white/5"
            />
          ))}
        </div>
      </div>
    )
  }

  if (watchlistFilms.length === 0) {
    return (
      <div className="mt-4">
        <ProfileSectionHeader title={t("profile.watchlist")} />
        <p className={cn(isGlass ? "text-white/40" : "text-muted-foreground")}>
          {t("profile.watchlistEmpty")}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <ProfileSectionHeader title={t("profile.watchlist")} />
      <div className="grid grid-cols-4 gap-4">
        {watchlistFilms.map((film) => (
          <MovieCard
            key={film.tmdb_id}
            movie={{
              id: film.tmdb_id,
              title: "",
              poster_path: film.poster_path,
              vote_average: 0
            }}
            externalid={film.tmdb_id}
          />
        ))}
      </div>
    </div>
  )
} 