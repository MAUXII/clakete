"use client" 

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  } from "@/components/ui/navigation-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "./dropdown-menu"
import { FiUser } from "react-icons/fi"
import { RiLoginBoxLine } from "react-icons/ri"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"
import { Moon, Sun } from "lucide-react"
import { BiHomeAlt } from "react-icons/bi"
import Link from "next/link"
import { useTheme } from "next-themes"
import { LuClapperboard, LuSearch, LuTrendingUp, LuStar, LuCalendar } from "react-icons/lu"
import { List } from "lucide-react"
import { MovieCard } from "../movies/movie-card"
import { useMovies } from "@/hooks/use-movies"
import { Skeleton } from "./skeleton"
import { useUser } from '@supabase/auth-helpers-react'
import { SearchCommand } from "../movies/search-command"
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useProfile } from "@/components/providers/profile-provider"
import React from "react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { movies, loading: moviesLoading } = useMovies()
  const featuredMovie = movies?.[0]
  const { profile, loading } = useProfile()
  const user = useUser()
  const supabase = useSupabaseClient()
  const router = useRouter()


  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <div className="flex px-4 z-[50] w-full max-w-[1152px] items-center gap-4 absolute  top-7 self-center  justify-center ">
     <Link href="/" className="h-12 aspect-square border-[1px] border-black/20 rounded-md dark:border-white/20 flex items-center justify-center" style={{background: "linear-gradient(154deg, rgba(241, 94, 116, 0.10) 4.04%, rgba(255, 23, 52, 0.10) 97.21%)"}}>
  <img 
    src="/logopage.svg"
    alt="Logo"
    className="w-full"
    style={{ display: 'block', verticalAlign: 'middle' }}
  />
</Link>
    <nav className=' w-full dark:bg-[#444444]/10 flex items-center justify-between px-2 bg-[#F5F5F5]/40 backdrop-blur-lg border-[1px] h-12 border-black/15 rounded-md dark:border-white/15 '>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <BiHomeAlt />
                Home
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem>
            <Link href="/lists" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                <List className="h-4 w-4" />
                Lists
              </NavigationMenuLink >
            </Link>
          </NavigationMenuItem >

          <NavigationMenuItem className="py-2  ">
            <NavigationMenuTrigger>
            <LuClapperboard />
            Movies
            </NavigationMenuTrigger >
            <NavigationMenuContent className="dark:bg-[#09090B]/70 bg-white/50 p-6 md:w-[400px] lg:w-[700px] flex gap-3">
            <NavigationMenuLink asChild>
                    <div
                      className="flex h-full w-1/3 select-none flex-col justify-end rounded-md   no-underline outline-none focus:shadow-md"
                    >
                      {moviesLoading ? (
                        <Skeleton className="w-full h-full" />
                      ) : featuredMovie ? (
                        <MovieCard key={featuredMovie.id} movie={featuredMovie} />
                      ) : null}
                    </div>
                  </NavigationMenuLink>
                            <ul className="grid w-2/3 gap-3 lg:grid-cols-2">
                <li className="group">
                  <Link href="/films/discover" className="block h-full">
                    <div className="h-full bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-xl p-6 hover:from-purple-500/10 hover:via-purple-500/15 hover:to-pink-500/10 hover:border-purple-500/30 transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Discover</h3>
                        <p className="text-sm text-muted-foreground font-medium">Filter by genre & filters</p>
                      </div>
                    </div>
                  </Link>
                </li>
                
                <li className="group">
                  <Link href="/films/popular" className="block h-full">
                    <div className="h-full bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-red-500/5 border border-orange-500/20 rounded-xl p-6 hover:from-orange-500/10 hover:via-orange-500/15 hover:to-red-500/10 hover:border-orange-500/30 transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">Popular</h3>
                        <p className="text-sm text-muted-foreground font-medium">Trending worldwide</p>
                      </div>
                    </div>
                  </Link>
                </li>
                
                <li className="group">
                  <Link href="/films/top-rated" className="block h-full">
                    <div className="h-full bg-gradient-to-br from-yellow-500/5 via-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-xl p-6 hover:from-yellow-500/10 hover:via-yellow-500/15 hover:to-amber-500/10 hover:border-yellow-500/30 transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">Top Rated</h3>
                        <p className="text-sm text-muted-foreground font-medium">Critically acclaimed</p>
                      </div>
                    </div>
                  </Link>
                </li>
                
                <li className="group">
                  <Link href="/films/upcoming" className="block h-full">
                    <div className="h-full bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-xl p-6 hover:from-blue-500/10 hover:via-blue-500/15 hover:to-cyan-500/10 hover:border-blue-500/30 transition-all duration-300 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">Upcoming</h3>
                        <p className="text-sm text-muted-foreground font-medium">Coming soon</p>
                      </div>
                    </div>
                  </Link>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <SearchCommand />
    </nav>
 
    <DropdownMenu>
      <DropdownMenuTrigger className='h-12 ring-1 dark:ring-white/20 ring-black/20 overflow-clip focus:outline-none aspect-square dark:bg-gray-400/10 flex items-center justify-center bg-gray-300/20 rounded-md'>
      {!loading && (
          <>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser />
            )}
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end"  className='dark:bg-[#09090B]  mt-1 bg-white'>
      {profile ? (
        <>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}`}>
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}/films`}>
            Films
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${profile.username}/watchlist`}>
            Watchlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/lists">
            Lists
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className='dark:bg-[#09090B] bg-white'>
              <ToggleGroup
                type="single"
                className='flex flex-col w-full dark:text-white text-black'
                value={theme}
                onValueChange={(value) => {
                  if (value === 'light' || value === 'dark') {
                    setTheme(value);
                  }
                }}
              >
                <ToggleGroupItem className='w-full' value="light" aria-label="Toggle Light">
                  <p className='font-medium'>Light</p><Sun className="h-[1.2rem] w-[1.2rem] " />
                </ToggleGroupItem>
                <ToggleGroupItem className='w-full' value="dark" aria-label="Toggle Dark">
                  <p className='font-medium'>Dark</p><Moon className="h-[1.2rem] w-[1.2rem]" />
                </ToggleGroupItem>
              </ToggleGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign Out
        </DropdownMenuItem>
      </>
        ) : (
          <>
          <DropdownMenuSub>
          <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className='dark:bg-[#09090B] bg-white'>
              <ToggleGroup
                type="single"
                className='flex flex-col w-full dark:text-white text-black'
                value={theme}
                onValueChange={(value) => {
                  if (value === 'light' || value === 'dark') {
                    setTheme(value);
                  }
                }}
              >
                <ToggleGroupItem className='w-full' value="light" aria-label="Toggle Light">
                  <p className='font-medium'>Light</p><Sun className="h-[1.2rem] w-[1.2rem] " />
                </ToggleGroupItem>
                <ToggleGroupItem className='w-full' value="dark" aria-label="Toggle Dark">
                  <p className='font-medium'>Dark</p><Moon className="h-[1.2rem] w-[1.2rem]" />
                </ToggleGroupItem>
              </ToggleGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sign-in">
            <RiLoginBoxLine className="mr-2 h-4 w-4" />
            Sign In
          </Link>
        </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none overflow-hidden space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-md font-medium leading-none">{title}</div>
          <p className="line-clamp-5 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
