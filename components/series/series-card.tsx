"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { IoEyeOutline, IoEye, IoHeartOutline, IoHeart } from "react-icons/io5"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useFilmInteractions } from "@/hooks/use-film-interactions"

interface SeriesCardProps {
  series?: {
    id?: number
    name: string
    poster_path: string | null
    vote_average?: number
    /** TMDB first air date — vai para `items_interactions.release_date`. */
    first_air_date?: string | null
  }
  externalid?: number
  variant?: "default" | "nav-fill"
}

export function SeriesCard({ series: show, externalid, variant = "default" }: SeriesCardProps) {
  const seriesId = externalid ?? show?.id ?? 0
  const { isWatched, isLiked, toggleWatched, toggleLiked, updating } = useFilmInteractions(
    seriesId || 0,
    show?.poster_path || undefined,
    show?.name,
    show?.first_air_date ?? undefined,
    "tv",
  )
  const [localWatched, setLocalWatched] = useState(isWatched)
  const [localLiked, setLocalLiked] = useState(isLiked)

  useEffect(() => {
    setLocalWatched(isWatched)
    setLocalLiked(isLiked)
  }, [isWatched, isLiked])

  const handleAction = (action: "watch" | "like", e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (updating) return

    if (action === "watch") {
      setLocalWatched(!localWatched)
      toggleWatched()
      toast.success(localWatched ? "Removido dos assistidos" : "Adicionado aos assistidos")
    } else {
      setLocalLiked(!localLiked)
      toggleLiked()
      toast.success(localLiked ? "Removido dos favoritos" : "Adicionado aos favoritos")
    }
  }

  const isNavFill = variant === "nav-fill"

  const renderCard = (id: number) => (
    <Link
      href={`/series/${id}`}
      className={cn(
        "group flex flex-col gap-2 transition-transform duration-300",
        isNavFill && "h-full min-h-0",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden border-[1px] border-black/15 shadow-black/5 shadow-sm dark:border-white/15 dark:shadow-white/5",
          isNavFill ? "aspect-auto h-full min-h-0 flex-1 rounded-xl" : "aspect-[2/3] h-full rounded-[5px]",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {show?.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
            alt={show?.name || "Series poster"}
            className="h-full w-full object-cover transition-all"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted-foreground/10 text-2xl font-medium">
            ?
          </div>
        )}

        {show?.vote_average ? (
          <div className="absolute bottom-2 right-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <Badge variant="secondary" className="rounded-sm font-medium text-[#FF0048]">
              {show.vote_average.toFixed(1)} ★
            </Badge>
          </div>
        ) : null}

        <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => handleAction("watch", e)}
            className={`rounded-md border p-2 transition-colors ${
              localWatched
                ? "border-[#FF0048]/20 bg-[#280F16] text-[#FF0048] hover:bg-[#280F16]"
                : "border-transparent bg-secondary text-white hover:border-[#FF0048]/20 hover:bg-[#280F16] hover:text-[#FF0048]"
            }`}
            title={localWatched ? "Remover dos assistidos" : "Marcar como assistido"}
          >
            {localWatched ? <IoEye className="h-4 w-4" /> : <IoEyeOutline className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(e) => handleAction("like", e)}
            className={`rounded-md border p-2 transition-colors ${
              localLiked
                ? "border-[#FF0048]/20 bg-[#280F16] text-[#FF0048] hover:bg-[#280F16]"
                : "border-transparent bg-secondary text-white hover:border-[#FF0048]/20 hover:bg-[#280F16] hover:text-[#FF0048]"
            }`}
            title={localLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {localLiked ? <IoHeart className="h-4 w-4" /> : <IoHeartOutline className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Link>
  )

  if (externalid) {
    return renderCard(externalid)
  }

  return renderCard(show?.id || 0)
}
