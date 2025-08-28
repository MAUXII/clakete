import Link from 'next/link'
import { Movie } from '@/types/movie'
import { Badge } from "@/components/ui/badge"
import { useFilmInteractions } from '@/hooks/use-film-interactions'
import { IoEyeOutline, IoEye } from "react-icons/io5"
import { IoHeartOutline, IoHeart } from "react-icons/io5"
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

interface MovieCardProps {
  movie?:{
    id?: number;
    title: string;
    poster_path: string | null;
    vote_average?: number;
  }
  externalid?: number;
}

export function MovieCard({ movie, externalid }: MovieCardProps) {
  const filmId = externalid || movie?.id
  const { isWatched, isLiked, toggleWatched, toggleLiked, updating } = useFilmInteractions(filmId || 0, movie?.poster_path || undefined)
  const [localWatched, setLocalWatched] = useState(isWatched)
  const [localLiked, setLocalLiked] = useState(isLiked)

  // Atualiza o estado local quando o estado do hook mudar
  useEffect(() => {
    setLocalWatched(isWatched)
    setLocalLiked(isLiked)
  }, [isWatched, isLiked])

  const handleAction = (action: 'watch' | 'like', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (updating) return

    if (action === 'watch') {
      setLocalWatched(!localWatched)
      toggleWatched()
      toast.success(localWatched ? 'Removido dos assistidos' : 'Adicionado aos assistidos')
    } else {
      setLocalLiked(!localLiked)
      toggleLiked()
      toast.success(localLiked ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
    }
  }

  const renderCard = (id: number) => (
    <Link
      href={`/film/${id}`}
      className="group flex flex-col gap-2 transition-transform duration-300"
    >
      <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {movie?.poster_path? (
        <img
        src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
        alt={movie?.title || 'Movie poster'}
        className="w-full transition-all h-full object-cover"
      />
        ):(
          <div className="w-full h-full flex items-center justify-center font-medium text-2xl bg-muted-foreground/10">?</div>
         )
         }
        
        {movie?.vote_average && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="font-medium text-[#FF0048] rounded-sm">
              {movie.vote_average.toFixed(1)} ★
            </Badge>
          </div>
        )}
        <div className="absolute flex-col top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => handleAction('watch', e)}
            className={`p-2 rounded-md border transition-colors ${
              localWatched 
                ? "bg-[#280F16] text-[#FF0048] border-[#FF0048]/20 hover:bg-[#280F16]" 
                : "bg-secondary text-white border-transparent hover:bg-[#280F16] hover:text-[#FF0048] hover:border-[#FF0048]/20"
            }`}
            title={localWatched ? 'Remover dos assistidos' : 'Marcar como assistido'}
          >
            {localWatched ? <IoEye className="w-4 h-4" /> : <IoEyeOutline className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => handleAction('like', e)}
            className={`p-2 rounded-md border transition-colors ${
              localLiked 
                ? "bg-[#280F16] text-[#FF0048] border-[#FF0048]/20 hover:bg-[#280F16]" 
                : "bg-secondary text-white border-transparent hover:bg-[#280F16] hover:text-[#FF0048] hover:border-[#FF0048]/20"
            }`}
            title={localLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            {localLiked ? <IoHeart className="w-4 h-4" /> : <IoHeartOutline className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Link>
  )

  if (externalid) {
    return renderCard(externalid)
  }

  return renderCard(movie?.id || 0)
}