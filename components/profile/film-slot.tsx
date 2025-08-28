"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"

interface Film {
  film_id: number
  title: string
  poster_path: string
  backdrop_path: string
  position: number
}

interface FilmSlotProps {
  film?: Film
  position: number
  onSelect: (position: number) => void
  onRemove: (filmId: number) => void
}

export function FilmSlot({ film, position, onSelect, onRemove }: FilmSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: position.toString(),
    data: { film, position }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-[150px] h-[225px] bg-card rounded-md overflow-hidden border group"
    >
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
        <Button
          onClick={() => onSelect(position)}
          variant="ghost"
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs">Add Film</span>
        </Button>
      )}
    </div>
  )
}
