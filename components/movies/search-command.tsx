'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DialogTitle } from "../ui/dialog"

export function SearchCommand() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Movie[]>([])
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
        setResults(data.results ? data.results.slice(0, 30) : [])
        console.log("Resultados obtidos:", data.results)
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

  return (
    <>
      <Button
        variant="outline"
        className="relative border-none h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search</span>
        <span className="sr-only">Buscar filmes</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="flex items-center gap-2 text-sm" />
        <CommandInput
          placeholder="Search"
          value={query}
          onValueChange={setQuery}
          className=""
        />
        <CommandList className="custom-scrollbar max-h-[400px]">
          {loading && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}
          {!loading && results.length === 0 && query && (
            <CommandEmpty>Nenhum filme encontrado.</CommandEmpty>
          )}
          {!loading && results.length > 0 && (
         
              <CommandGroup heading="" data-cmdk-no-filter>
                
                {results.map((movie) => (
                 
                    
                      <CommandItem
                        key={movie.id}
                        value={movie.title || ""}
                        data-cmdk-no-filter
                        onSelect={() => {
                          router.push(`/film/${movie.id}`)
                          setOpen(false)
                        }}
                        className="my-4 mx-3"
                        style={{
                          padding: '0px'
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
                  <div className="absolute z-20 inset-0 rounded bg-black/60 flex items-center justify-center p-4">
                    <p className="font-bold text-center text-white ">{movie.title}</p>
                  </div>
                  <span style={{
                    WebkitTextStrokeWidth: '0.5px',
                    WebkitTextStrokeColor: '#FF0048'
                  }} className="text-[#FF0048]/30 z-10 absolute items-center justify-center h-full flex font-bold text-8xl">{movie.release_date ? new Date(movie.release_date).getFullYear() : "Sem data"}</span>
                </div>

                       
                      </CommandItem>
                    
                   
                ))}
              </CommandGroup>
           
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
