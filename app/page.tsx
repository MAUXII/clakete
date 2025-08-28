'use client'

import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'
import { useUser } from '@supabase/auth-helpers-react'
import Link from 'next/link'
import { Advantage } from '@/components/ui/advantage'
import { FaRegHeart } from "react-icons/fa6";
import { GrWaypoint } from "react-icons/gr";
import { FaRegFolderOpen } from "react-icons/fa";
import { MdOutlineReviews } from "react-icons/md";
import Image from 'next/image'
import { BsLightningChargeFill } from "react-icons/bs";
import { UserRecentReviews } from "@/components/profile/recent-reviews";

interface UserProfile {
  username: string
  avatar_url: string | null
}

interface Movie {
  id: number
  title: string
  backdrop_path: string | null
  poster_path: string | null
  overview: string | null
  vote_average: number | null
}

export default function HomePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null)
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([])
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([])
  const user = useUser()
  const supabase = useSupabaseClient()

  useEffect(() => {
    async function getProfile() {
      try {
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', user.id)
            .single()

          if (error) throw error
          setUserProfile(data)
        }
      } catch {
        // Error handling
      } finally {
        setLoading(false)
      }
    }
    getProfile()
  }, [user, supabase])

  useEffect(() => {
    async function fetchFeaturedMovie() {
      try {
        const response = await fetch('/api/movies?type=now_playing&page=1')
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setFeaturedMovie(data.results[0])
          setFeaturedMovies(data.results.slice(0, 6))
        }
      } catch (error) {
        console.error('Erro ao buscar filme em destaque:', error)
      }
    }
    fetchFeaturedMovie()
  }, [])

  useEffect(() => { 
    async function fetchUpcomingMovies() {
      try {
        const response = await fetch('/api/movies?type=upcoming&page=1')
        const data = await response.json()
        if (data.results && data.results.length > 0) {
          setUpcomingMovies(data.results.slice(0, 6)) 
        }
      } catch (error) {
        console.error('Erro ao buscar filmes populares:', error)
      }
    }
    fetchUpcomingMovies()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  // Se não houver usuário logado, mostra a Landing Page
  if (!user) {
    const backgroundImage = featuredMovie?.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`
      : '/wavebg.png'

    return (
      <section className="py-8 mt-20 px-4 w-full max-w-[1152px]">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-full h-[450px] border dark:border-white/20 border-black/20 rounded-lg bg-black/50 bg-cover bg-center relative group"
            style={{ 
              backgroundImage: `url('${backgroundImage}')`,
              backgroundPosition: 'center 20%'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t rounded-lg from-black/60 to-transparent" />
          </div>
          <div className="flex flex-col items-center gap-4 translate-y-[-60px]">
            <h1 className="text-4xl max-w-[600px] font-semibold text-center text-white">
             <p className='sombra-contorno'>Track films you&apos;ve watched.</p>
             <p className='sombra-contorno'>Save those you want to see.</p>
             <p className='sombra-contorno'>Tell your friends what&apos;s good.</p>
            </h1>
            <button className="bg-[#FF0048] font-medium mt-4 py-3 px-3 text-center border rounded-sm border-white/20 text-white shadow-lg shadow-[#FF0048]/40">
            Get&apos;s started - totally free!
            </button>
          </div>
          <div className="flex w-full space-x-3">
            {featuredMovies && featuredMovies.slice(0, 6).map((movie) => (
                 <Link
                 key={movie.id}
                 href={`/film/${movie.id}`}
                 className="group flex flex-col gap-2 transition-transform duration-300"
               >
                 <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <img
                     src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
                     alt={movie?.title || 'Movie poster'}
                     className="w-full transition-all h-full object-cover"
                   />
                 </div>
               </Link>
            ))}
          </div>
          <div className='flex flex-col mt-4 w-full gap-4'>
          <p className='dark:text-muted text-muted-foreground font-semibold'>CLAKETE LETS YOU...</p>
            <div className='flex gap-4'>
            <div className="grid grid-cols-3 gap-4 w-full">
              <Advantage
                icon={<FaRegHeart />}
                color="#FF5182"
                title="Clak It"
                text="Show some love for your favorite films, lists and reviews with a like too."
              />
              <Advantage
                icon={<GrWaypoint />}
                color="#87FF50"
                title="Track It"
                text="Track every film you watch. Log the date, rate it, and add your thoughts. Your personal film diary starts here."
              />
              <Advantage
                icon={<FaRegFolderOpen />}
                color="#FFA251"
                title="List It"
                text="Create and share lists of films on any theme. Build your watchlist and never miss a movie again. "
              />
            </div>
            </div>
            <div className='flex gap-4'>
            <Advantage
              icon={<MdOutlineReviews />}
              color="#5188FF"
              title="Review It"
              text="Write reviews to share your thoughts. From quick takes to deep dives, your voice matters. Engage with the community and discover new perspectives."
              className="col-span-2"
            />
            <Advantage className='max-w-[362.66]'
              icon={<FaRegHeart />}
              color="#7C51FF"
              title="Rate It"
              text="Rate each film on a five-star scale (with halves) to record and share your reaction"
            />
            </div>
          </div>
        <div className="w-full flex justify-between items-center mt-4">
          <div className='flex flex-col gap-4'>
            <p className='dark:text-muted text-muted-foreground font-semibold'>WRITE AND SHARE REVIEWS</p>
            <Image width={379} src={"/reviews.png"} height={548} alt='write and share reviews'/>
          </div>

          <div className='flex flex-col gap-4'>
            <p className='dark:text-muted text-muted-foreground font-semibold'>MAKE LISTS</p>
            <Image width={330} src={"/lists.png"} height={541} alt='make lists'/>
          </div>
          
          
        </div>

        <div className='flex flex-col gap-4 w-full mt-4'>
            <p className='dark:text-muted text-muted-foreground font-semibold'>CREATE YOUR OWN PROFILE...</p>
            <div style={{
              backgroundImage: 'url("/createyourownprofile.png")'
            }}
            className='w-full h-[410px] rounded-md bg-cover bg-center border dark:border-white/20 border-black/20'></div>
        </div>

        <div className='flex flex-col w-full mt-16 items-center justify-center'>
          <h2 className='font-medium text-3xl'>Join the Film Revolution</h2>
          <p className='text-muted-foreground'>Be part of a vibrant community that celebrates cinema.</p>
          <button className="bg-[#FF0048] max-w-fit font-medium mt-4 py-3 px-3 text-center border rounded-sm border-white/20 text-white shadow-lg shadow-[#FF0048]/40">
             Let&apos;s do It - It&apos;s free!
          </button>
        </div>
        </div>
      </section>
    )
  }

  // Se houver usuário logado, mostra a página de boas-vindas
  return (
    <section className="min-h-[100vh] py-8 mt-20 px-4 w-full max-w-[1152px] flex flex-col justify-start ">
      
      <div className="flex flex-col mb-10 animate-fade-in">
        {userProfile && (
          <>


            <div className='flex flex-col gap-1'>
            <h1 className='text-[#FF0048] text-4xl font-bold'>Welcome back, <span className='text-white'>{userProfile.username}.</span></h1>
            <p className='text-muted-foreground text-md'>This homepage will become customized for you</p>
            
            </div>
            
          </>
        )}
      </div>
      <div className='flex w-full gap-12 '>
        <div className='w-full'>
        
          <UserRecentReviews limit={1} onLandingPage />
        </div>
<div className='flex max-w-96 flex-col '>
      {/* NEW ON CLAKETE */}
      <div className="w-full mb-12">
        <div className='flex w-full justify-between items-center'>
          <p className='text-muted-foreground font-medium mb-2 text-xs'>NEW ON CLAKETE</p>
          <p className='dark:text-muted flex items-center gap-2 font-medium mb-2 text-xs '>
            <BsLightningChargeFill className='text-muted' />
          YOUR ACTIVITY</p>
        </div>
        <div className='w-full h-[0.2px] dark:bg-muted bg-muted-foreground' />
        <div className="flex mt-2 gap-4 overflow-x-auto pb-2">
          {featuredMovies && featuredMovies.slice(0, 3).map((movie) => (
                 <Link
                 key={movie.id}
                 href={`/film/${movie.id}`}
                 className="group flex flex-col gap-2 transition-transform duration-300"
               >
                 <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <img
                     src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
                     alt={movie?.title || 'Movie poster'}
                     className="w-full transition-all h-full object-cover"
                   />
                 </div>
               </Link>
            ))}
        </div>
      </div>

      {/* POPULAR ON CLAKETE */}
      <div className="w-full mb-12">
        <div className='flex w-full justify-between items-center'>
          <p className='text-muted-foreground font-medium mb-2 text-xs'>UPCOMING MOVIES</p>
          <p className='dark:text-muted flex items-center gap-2 font-medium mb-2 text-xs '>
          MORE</p>
        </div>
        <div className='w-full h-[0.2px] dark:bg-muted bg-muted-foreground' />
        <div className="flex mt-2 gap-4 overflow-x-auto pb-2">
          {upcomingMovies && upcomingMovies.slice(0, 3).map((movie) => (
                 <Link
                 key={movie.id}
                 href={`/film/${movie.id}`}
                 className="group flex flex-col gap-2 transition-transform duration-300"
               >
                 <div className="w-full border-[1px] border-black/15 shadow-black/5 dark:border-white/15 h-full relative shadow-sm dark:shadow-white/5 aspect-[2/3] rounded-[5px] overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   <img
                     src={movie?.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/placeholder.png'}
                     alt={movie?.title || 'Movie poster'}
                     className="w-full transition-all h-full object-cover"
                   />
                 </div>
               </Link>
            ))}
        </div>
      </div>
      </div>
      </div>
    </section>
  )
}