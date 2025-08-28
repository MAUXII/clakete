"use client"

import { List } from "@/types/list"

import { Eye, EyeOff, Film } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface ListCardProps {
  list: List
}

export function UserListCard({ list }: ListCardProps) {
  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div className="group flex flex-col gap-4 w-full h-full">
        
        {/* Thumbnail da lista */}
        <div className="w-full">
          <div className="w-full aspect-video rounded-md border dark:border-white/20 border-black/20 overflow-hidden bg-muted relative">
            {list.backdrop_path && list.backdrop_path.trim() !== "" ? (
              <Link href={`/lists/${list.id}`} className="block">
                <Image 
                  src={list.backdrop_path} 
                  alt={list.title} 
                  className="w-full h-auto object-cover"
                  width={1920}
                  height={1080}
                />
              </Link>
            ) : (
              <Link href={`/lists/${list.id}`} className="w-full h-full flex items-center text-center justify-center text-muted-foreground text-xs">
                {list.films_count || 0} films
              </Link>
            )}
          </div>
        </div>

        {/* Informações da lista */}
        <div className="flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-4 mb-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Film className="h-3 w-3" />
                  <span>{list.films_count || 0} filmes</span>
                </div>
               
                {list.is_public ? (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>Pública</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    <span>Privada</span>
                  </div>
                )}
              </div>
          <div className="flex">
            
            <div className="flex-1">
                
              <Link href={`/lists/${list.id}`} className="flex justify-between">
                <h3 className="text-lg font-medium text-foreground hover:text-[#e94e7a] transition-colors truncate">
                  {list.title}
                </h3>
              </Link>
              
              {list.bio && (
                <p className="text-sm text-muted-foreground text-start line-clamp-1">
                  {list.bio}
                </p>
              )}
              
            

             
              </div>
            </div>
          </div>
        </div>
      </div>
    
  )
}
