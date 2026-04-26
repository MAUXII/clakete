"use client"

import { List } from "@/types/list"
import { Eye, EyeOff, Film } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ListPosterStack } from "@/components/lists/list-poster-stack"
import { listPublicHref } from "@/lib/list-href"

interface ListCardProps {
  list: List
}

function UserListThumb({ list }: { list: List }) {
  const hasPreview = list.preview_posters && list.preview_posters.length > 0

  if (hasPreview) {
    return (
      <ListPosterStack className="mx-auto sm:mx-0" posters={list.preview_posters!} />
    )
  }

  if (list.backdrop_path && list.backdrop_path.trim() !== "") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-black/20 bg-muted dark:border-white/20">
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

  return (
    <ListPosterStack className="mx-auto sm:mx-0" posters={[]} />
  )
}

export function UserListCard({ list }: ListCardProps) {
  return (
    <div className="group flex h-full w-full flex-col gap-2">
      <div className="w-full">
        <Link href={listPublicHref(list)} className="block transition-opacity hover:opacity-95">
          <UserListThumb list={list} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="mb-1 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Film className="h-3 w-3" />
            <span>{list.films_count ?? 0} filmes</span>
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
          <div className="min-w-0 flex-1">
            <Link href={listPublicHref(list)} className="flex justify-between">
              <h3 className="truncate text-lg font-medium text-foreground transition-colors hover:text-[#e94e7a]">
                {list.title}
              </h3>
            </Link>

            {list.bio && <p className="line-clamp-1 text-start text-sm text-muted-foreground">{list.bio}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
