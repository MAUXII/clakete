"use client"

import { List } from "@/types/list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Film } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ListPosterStack } from "@/components/lists/list-poster-stack"
import { listPublicHref, userProfilePath } from "@/lib/list-href"

interface ListCardProps {
  list: List
}

function ListThumb({ list }: { list: List }) {
  const hasPreview = list.preview_posters && list.preview_posters.length > 0

  if (hasPreview) {
    return <ListPosterStack posters={list.preview_posters!} />
  }

  if (list.backdrop_path && list.backdrop_path.trim() !== "") {
    return (
      <div className="relative aspect-video w-full max-w-96 overflow-hidden rounded-md border border-black/20 bg-muted dark:border-white/20">
        <Image
          src={list.backdrop_path}
          alt={list.title}
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
      </div>
    )
  }

  return <ListPosterStack posters={[]} />
}

export function ListCard({ list }: ListCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="mb-4 h-[0.3px] w-full bg-muted-foreground/10" />
      <div className="group flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Link href={listPublicHref(list)} className="block shrink-0 transition-opacity hover:opacity-95">
          <ListThumb list={list} />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex-1">
            <Link href={listPublicHref(list)} className="block">
              <h3 className="truncate text-lg font-medium text-foreground transition-colors hover:text-[#e94e7a]">
                {list.title}
              </h3>
            </Link>

            {list.bio && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{list.bio}</p>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Film className="h-3 w-3" />
                <span>{list.films_count ?? 0} filmes</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(list.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Link href={userProfilePath(list.userData?.username)}>
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={list.userData?.avatar_url || undefined}
                    alt={list.userData?.display_name || list.userData?.username || ""}
                  />
                  <AvatarFallback className="text-xs font-medium">
                    {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Link
                href={userProfilePath(list.userData?.username)}
                className="text-xs text-muted-foreground transition-colors hover:text-[#e94e7a]"
              >
                {list.userData?.display_name || list.userData?.username}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
