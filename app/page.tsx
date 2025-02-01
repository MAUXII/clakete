'use client'
import { useEffect, useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
 
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const { setTheme } = useTheme()

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch(`/api/movies?page=${page}`);
        const data = await response.json();
        setMovies(data.results);
      } catch (error) {
        console.error('Erro ao buscar filmes:', error);
      }
    };

    fetchMovies();
  }, [page]);

  return (
    <main className='flex w-full min-h-screen items-center justify-center dark:bg-[#09090B]  '>
    <section className='w-full flex h-full min-h-screen  items-start justify-center pt-24 py-10 md:py-10 md:pt-10 pb-6 px-8'>
    <div className='flex flex-col gap-3 w-[940px]'>
    <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>  
      </div>
      <div className='flex flex-col'>
      <h2 className=' text-2xl font-bold FilmeSans'>Explorar</h2>
      <p className='dark:text-gray-300 text-gray-600'>Aventure-se em uma vasta coleção de filmes de diversos gêneros.</p>
      </div>
      
      <div className='grid grid-cols-3 lg:grid-cols-5 gap-3'>
        {movies.map((movie) => (
          <div key={movie.id} className='w-full border-[1px] border-white/15 h-full relative shadow-sm shadow-white/5 shadow-lg shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden '>
            <div className='border-[2.5px] border-black/10 absolute w-full h-full hover:border-black/40 transition-all duration-700 '></div>
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className='  w-full h-full object-cover'
              
            />
            
            
          </div>
        ))}
      </div>
      <Pagination>
  <PaginationContent className='w-full flex justify-between'>
    <PaginationItem>
      <PaginationPrevious className='cursor-pointer' onClick={() => {
        setPage(page > 1 ? page - 1 : 1);
        window.scrollTo({ 
          top: 0,
          behavior: 'smooth' 
        });
      }}
        />
    </PaginationItem>
    
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext className='cursor-pointer' 
      onClick={() => {
        setPage(page + 1); 
        
        window.scrollTo({ 
          top: 0,
          behavior: 'smooth' 
        });
      }}  
    />
    </PaginationItem>
  </PaginationContent>
</Pagination>
      </div>
      
    </section>
    </main>
  );
}