'use client'

import { useEffect, useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { Movie } from "@/lib/tmdb/client"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Search } from "lucide-react"
import { Button } from "../ui/button"

interface ImageSearchCommandProps {
  onSelect: (image: string) => void;
  type: 'avatar' | 'banner';
  open?: boolean;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
}

export function ImageSearchCommand({ onSelect, type, isOpen, onOpenChange }: ImageSearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [results, setResults] = useState<Movie[]>([])
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true)
      try {
        let endpoint = ""
        if (debouncedQuery.trim().length === 0) {
          // Se não tiver buscado nada, exibe filmes populares
          endpoint = "/api/movies"
        } else {
          endpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`
        }
        const response = await fetch(endpoint)
        const data = await response.json()
        console.log("Resultados obtidos:", data.results)
        setResults(data.results ? data.results.slice(0, 5) : [])
      } catch (error) {
        console.error("Erro ao buscar filmes:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [debouncedQuery])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Busca imagens do filme selecionado
  useEffect(() => {
    const fetchImages = async () => {
      if (!selectedMovie) return
      try {
        const response = await fetch(`/api/movies/${selectedMovie.id}/images`)
        const data = await response.json()
        const imageUrls = type === 'banner' 
          ? data.backdrops.map((img: any) => `https://image.tmdb.org/t/p/original${img.file_path}`)
          : data.posters.map((img: any) => `https://image.tmdb.org/t/p/original${img.file_path}`)
        setImages(imageUrls)
      } catch (error) {
        console.error("Erro ao buscar imagens:", error)
      }
    }
    fetchImages()
  }, [selectedMovie, type])

  return (
    <>
      <CommandDialog open={isOpen} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder={`Buscar filme para ${type === 'banner' ? 'banner' : 'avatar'}`}
          value={query}
          onValueChange={setQuery}
          className=""
        />
        <CommandList>
          {loading && <CommandEmpty>Buscando...</CommandEmpty>}
          
          {!selectedMovie ? (
            // Lista de filmes
            <CommandGroup heading="Filmes">
              {movies.map((movie) => (
                <CommandItem
                  key={movie.id}
                  onSelect={() => setSelectedMovie(movie)}
                >
                  <div className="flex items-center gap-2">
                    {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              
                        className="h-12 w-8 object-cover rounded"
                      />
                    )}
                    <span>{movie.title}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            // Lista de imagens do filme selecionado
            <CommandGroup heading="Imagens disponíveis" className="max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 p-2">
                {images.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${selectedMovie.title} ${index + 1}`}
                    className="w-full h-auto cursor-pointer rounded hover:opacity-75"
                    onClick={() => {
                      onSelect(imageUrl)
                      setOpen(false)
                    }}
                  />
                ))}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedMovie(null)}
                className="w-full mt-2"
              >
                Voltar para busca
              </Button>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
} 