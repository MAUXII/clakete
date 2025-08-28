"use client"

import { List } from "@/types/list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Film } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ListCardProps {
  list: List
}

export function ListCard({ list }: ListCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted-foreground/10 w-full h-[0.3px] mb-4"></div>
      <div className="group flex gap-4">
        
        {/* Thumbnail da lista */}
        <div className="flex">
          <div className="aspect-video w-full max-w-96 rounded-md border dark:border-white/20 border-black/20 overflow-hidden bg-muted relative">
            {list.backdrop_path && list.backdrop_path.trim() !== "" ? (
              <Link href={`/lists/${list.id}`} className="block">
                <Image 
                  src={list.backdrop_path} 
                  alt={list.title} 
                  className="w-full h-full object-cover"
                  width={1920}
                  height={1080}
                />
              </Link>
            ) : (
              <Link href={`/lists/${list.id}`} className="w-96 max-w-96 h-full flex items-center justify-center text-muted-foreground text-xs">
                {list.films_count || 0} films
              </Link>
            )}
          </div>
        </div>

        {/* Informações da lista */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex">
            <div className="flex-1">
              <Link href={`/lists/${list.id}`} className="block">
                <h3 className="text-lg font-medium text-foreground hover:text-[#e94e7a] transition-colors truncate">
                  {list.title}
                </h3>
              </Link>
              
              {list.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {list.bio}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Film className="h-3 w-3" />
                  <span>{list.films_count || 0} filmes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(list.updated_at).toLocaleDateString()}</span>
                </div>
              
              </div>

              {/* Informações do criador */}
              <div className="flex items-center gap-2 mt-3">
                <Link href={`/${list.userData?.username}`}>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={list.userData?.avatar_url || undefined} alt={list.userData?.display_name || list.userData?.username || ''} />
                    <AvatarFallback className="text-xs font-medium">
                      {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Link href={`/${list.userData?.username}`} className="text-xs text-muted-foreground hover:text-[#e94e7a] transition-colors">
                  {list.userData?.display_name || list.userData?.username}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
