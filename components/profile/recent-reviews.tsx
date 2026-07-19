"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Database } from "@/lib/supabase/database.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { RatingStars } from "@/components/movies/star-rating"
import Image from "next/image"
import Link from "next/link"
import { ReviewLikeButton } from "@/hooks/use-review-like"

interface FilmReview {
  id: number
  tmdb_id: number
  media_type: string | null
  rating: number
  review: string
  created_at: string
  poster_path: string
  user_id: string
  userData?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  movie_title?: string
  release_date?: string
}

interface RecentReviewsProps {
  userId?: string
  limit?: number
  onLandingPage?: boolean
  emptyFallback?: ReactNode
  hideSectionTitle?: boolean
}

import { filmHref, seriesHref } from "@/lib/media-href"

function mediaHref(
  tmdbId: number,
  mediaType: string | null | undefined,
  title?: string | null,
) {
  return mediaType === "tv"
    ? seriesHref({ id: tmdbId, name: title })
    : filmHref({ id: tmdbId, title })
}

export function UserRecentReviews({
  userId,
  limit = 6,
  onLandingPage,
  emptyFallback,
  hideSectionTitle = false,
}: RecentReviewsProps) {
  const supabase = useSupabaseClient<Database>()
  const loggedInUser = useUser()
  const [reviews, setReviews] = useState<FilmReview[]>([])
  const [loading, setLoading] = useState(true)

  const targetUserId = userId || loggedInUser?.id || ""

  useEffect(() => {
    async function fetchReviews() {
      if (!targetUserId) return

      try {
        const { data, error } = await supabase
          .from("items_interactions")
          .select(
            "id, tmdb_id, media_type, rating, review, created_at, poster_path, user_id, movie_title, release_date",
          )
          .eq("user_id", targetUserId)
          .not("review", "is", null)
          .neq("review", "")
          .order("updated_at", { ascending: false })
          .limit(limit)

        if (error) throw error

        if (data) {
          const uniqueUserIds = [...new Set(data.map((review) => review.user_id))]
          const { data: usersData, error: usersError } = await supabase
            .from("users")
            .select("id, username, display_name, avatar_url")
            .in("id", uniqueUserIds)

          if (usersError) throw usersError

          const userById = new Map((usersData || []).map((user) => [user.id, user]))
          const reviewsWithUserData = data.map((review) => ({
            ...review,
            userData: userById.get(review.user_id)
              ? {
                  username: userById.get(review.user_id)!.username,
                  display_name: userById.get(review.user_id)!.display_name,
                  avatar_url: userById.get(review.user_id)!.avatar_url,
                }
              : undefined,
          }))

          setReviews(reviewsWithUserData)
        }
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchReviews()
  }, [supabase, targetUserId, limit])

  const sectionTitle = onLandingPage ? "Your Last Review" : "Recent reviews"

  if (loading) {
    return (
      <div className="w-full">
        {!hideSectionTitle ? (
          <>
            <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
              {sectionTitle}
            </h2>
            <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
          </>
        ) : null}
        <ul className="animate-pulse space-y-6">
          {Array.from({ length: onLandingPage ? 1 : 3 }).map((_, i) => (
            <li key={i} className="flex gap-3 border-b border-white/[0.06] pb-6 last:border-0 last:pb-0 sm:gap-4">
              <div className="aspect-[2/3] w-24 shrink-0 rounded-md bg-muted sm:w-28" />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div className="h-5 w-2/3 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-16 w-full rounded bg-muted" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (reviews.length === 0) {
    if (emptyFallback != null) {
      return (
        <div>
          {!hideSectionTitle ? (
            <>
              <h2 className="text-sm font-medium uppercase text-muted-foreground/50">
                {sectionTitle}
              </h2>
              <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
            </>
          ) : null}
          {emptyFallback}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {!hideSectionTitle ? (
        <>
          <h2 className="text-sm font-medium uppercase text-muted-foreground/50">{sectionTitle}</h2>
          <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
        </>
      ) : null}

      <ul className="space-y-6">
        {reviews.map((review) => {
          const href = mediaHref(review.tmdb_id, review.media_type, review.movie_title)
          const year = review.release_date
            ? new Date(review.release_date).getFullYear()
            : null

          return (
            <li key={review.id} className="border-b border-white/[0.06] pb-6 last:border-0 last:pb-0">
              <div className="flex gap-3 sm:gap-4">
                <Link href={href} className="shrink-0">
                  <div className="aspect-[2/3] w-24 overflow-hidden rounded-md border border-black/20 dark:border-white/20 sm:w-28">
                    <Image
                      src={
                        review.poster_path
                          ? `https://image.tmdb.org/t/p/w200${review.poster_path}`
                          : "/placeholder.png"
                      }
                      alt=""
                      width={112}
                      height={168}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={href} className="group inline-flex flex-wrap items-baseline gap-2">
                        <h3 className="text-lg font-medium text-zinc-100 transition-colors group-hover:text-brand sm:text-xl">
                          {review.movie_title}
                        </h3>
                        {year ? (
                          <span className="text-sm text-muted-foreground">{year}</span>
                        ) : null}
                      </Link>
                    </div>
                    <RatingStars
                      value={review.rating}
                      className="shrink-0"
                      starClassName="h-4 w-4"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/${review.userData?.username}`}>
                      <Avatar className="h-7 w-7 rounded-md border border-black/20 dark:border-white/20">
                        <AvatarImage
                          src={avatarDisplaySrc(review.userData?.avatar_url) || ""}
                          alt=""
                        />
                        <AvatarFallback className="rounded-md text-xs font-semibold">
                          {(
                            review.userData?.display_name?.[0] ||
                            review.userData?.username?.[0] ||
                            "U"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <Link
                      href={`/${review.userData?.username}`}
                      className="font-medium text-muted-foreground hover:text-[#e94e7a]"
                    >
                      {review.userData?.display_name || review.userData?.username}
                    </Link>
                    <span className="text-xs text-muted-foreground/70">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {review.review}
                  </p>
                  <div className="mt-2">
                    <ReviewLikeButton interactionId={review.id} />
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
