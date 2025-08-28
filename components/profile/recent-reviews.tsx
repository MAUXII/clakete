"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Database } from "@/lib/supabase/database.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { FaStar } from "react-icons/fa"
import Link from "next/link"

interface FilmReview {
  id: number
  film_id: number
  rating: number
  review: string
  created_at: string
  poster_path: string
  user_id: string
  userData?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  movie_title?: string
  release_date?: string
}

interface RecentReviewsProps {
  userId?: string
  limit?: number
  onLandingPage?: boolean
}

export function UserRecentReviews({ userId, limit = 6, onLandingPage }: RecentReviewsProps) {
  const supabase = useSupabaseClient<Database>()
  const loggedInUser = useUser()
  const [reviews, setReviews] = useState<FilmReview[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use o userId passado como prop ou o id do usuário logado
  const targetUserId = userId || (loggedInUser?.id || '')

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Exceção ao buscar dados do usuário:", error)
      return null
    }
  }

  useEffect(() => {
    async function fetchReviews() {
      if (!targetUserId) return

      try {
        // Buscar apenas reviews que tenham texto
        const { data, error } = await supabase
          .from("film_interactions")
          .select("id, film_id, rating, review, created_at, poster_path, user_id, movie_title, release_date")
          .eq("user_id", targetUserId)
          .not("review", "is", null)
          .neq("review", "")
          .order("updated_at", { ascending: false })
          .limit(limit)

        if (error) throw error

        if (data) {
          // Buscar dados do usuário para cada review
          const reviewsWithUserData = await Promise.all(
            data.map(async (review) => {
              const userData = await fetchUserData(review.user_id)
              return {
                ...review,
                userData: userData || undefined
              }
            })
          )

          setReviews(reviewsWithUserData)
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [supabase, targetUserId, limit])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return 
  }

  return (
    <div className="">
       {onLandingPage ? (
        <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Your Last Review</h2>
      ) : (
        <h2 className="font-medium text-muted-foreground/50 text-sm uppercase">Recent Reviews</h2>
      )}
    
      {reviews.map((review) => (
        
        <div key={review.id} className="group ">
            <div className="bg-muted-foreground/10 w-full h-[0.3px] mt-1 mb-4"></div>
          <div className="flex flex-col mb-4">
            <div className="flex gap-2">
              
                <Link href={`/film/${review.film_id}`}>
                  <div className="aspect-[2/3] w-32 rounded-md border dark:border-white/20 border-black/20 overflow-hidden">
                    <img 
                      src={review.poster_path ? `https://image.tmdb.org/t/p/w200${review.poster_path}` : '/placeholder.png'}
                      alt="Poster do filme"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>
            
               
              
              <div className="flex w-full justify-between gap-2   flex-1 flex-wrap">
              <div className="text-sm w-full flex flex-col gap-2 pl-2">
                <div className="w-full flex justify-between items-center">
                <div className=" flex items-center gap-2">
                  <h3 className="text-muted-foreground text-xl font-medium">
                    {review.movie_title}
                  </h3>
                  <span className="text-muted-foreground/50 text-md">{review.release_date ? new Date(review.release_date).getFullYear() : ''}</span>
                  </div>
                  <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`h-4 w-4 ${star <= review.rating ? "text-[#FF0048]" : "text-muted-foreground/30"}`}
                    />
                  ))}
                  </div>
              </div>
                  <div className="flex gap-2 items-center">
              {/* Foto de perfil com link para o perfil do usuário */}
              <Link href={`/${review.userData?.username}`}>
                <Avatar className="h-8 w-8 rounded-md border dark:border-white/20 border-black/20">
                  <AvatarImage src={review.userData?.avatar_url || undefined} alt={review.userData?.display_name || review.userData?.username || ''} />
                  <AvatarFallback className="rounded-md text-base font-semibold w-full flex">{(review.userData?.display_name?.[0] || review.userData?.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              {/* Nome do usuário */}
              <Link href={`/${review.userData?.username}`} className="text-muted-foreground font-medium hover:text-[#e94e7a]">
                {review.userData?.display_name || review.userData?.username}
              </Link>
             
              {/* Data da review */}
              <span className="text-xs text-muted-foreground/70">
                {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
              </span>
              
            </div>

                <p className="text-muted-foreground w-full text-sm leading-relaxed whitespace-pre-wrap">
                  {review.review}
                </p>
                
                </div>
                
              <div className="flex">
                 
              </div>
              </div>
            </div>
            
              
            
          </div>
        </div>
      ))}
    </div>
  )
} 