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
import { useT } from "@/components/providers/i18n-provider"
import { ProfileSectionHeader } from "@/components/profile/profile-section-header"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"

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
  original_title?: string | null
  original_name?: string | null
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
import { userWatchLogPathFromSlug } from "@/lib/user-media-href"
import { canonicalMediaCacheKey } from "@/lib/client/canonical-media-slug"
import { useCanonicalMediaSlugs } from "@/hooks/use-canonical-media-slugs"

export function UserRecentReviews({
  userId,
  limit = 6,
  onLandingPage,
  emptyFallback,
  hideSectionTitle = false,
}: RecentReviewsProps) {
  const { t } = useT()
  const isGlass = useDesignMode() === "glass"
  const supabase = useSupabaseClient<Database>()
  const loggedInUser = useUser()
  const [reviews, setReviews] = useState<FilmReview[]>([])
  const [loading, setLoading] = useState(true)

  const targetUserId = userId || loggedInUser?.id || ""
  const isOwnProfile = Boolean(loggedInUser?.id && targetUserId === loggedInUser.id)
  const showSectionTitle = !hideSectionTitle

  useEffect(() => {
    async function fetchReviews() {
      if (!targetUserId) return

      try {
        const { data, error } = await supabase
          .from("items_interactions")
          .select(
            "id, tmdb_id, media_type, rating, review, created_at, poster_path, user_id, movie_title, original_title, original_name, release_date",
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

  const slugByKey = useCanonicalMediaSlugs(
    reviews,
    isOwnProfile ? supabase : null,
    isOwnProfile ? targetUserId : undefined,
  )

  const reviewHref = (review: FilmReview) => {
    const username = review.userData?.username
    const kind = review.media_type === "tv" ? "tv" : "movie"
    if (username) {
      const slug = slugByKey[canonicalMediaCacheKey(review.media_type, review.tmdb_id)]
      if (!slug) return null
      return userWatchLogPathFromSlug(username, kind, slug, 0)
    }
    return kind === "tv"
      ? seriesHref({
          id: review.tmdb_id,
          original_name: review.original_name,
          name: review.movie_title,
          first_air_date: review.release_date,
        })
      : filmHref({
          id: review.tmdb_id,
          original_title: review.original_title,
          title: review.movie_title,
          release_date: review.release_date,
        })
  }

  const sectionTitle = onLandingPage
    ? t("profile.yourLastReview")
    : t("profile.recentReviews")

  if (loading) {
    return (
      <div className="w-full">
        {showSectionTitle ? (
          <ProfileSectionHeader title={sectionTitle} glassMode="soft" />
        ) : null}
        <ul className="animate-pulse space-y-6">
          {Array.from({ length: onLandingPage ? 1 : 3 }).map((_, i) => (
            <li
              key={i}
              className={cn(
                "flex gap-3 border-b pb-6 last:border-0 last:pb-0 sm:gap-4",
                isGlass ? "border-white/10" : "border-border",
              )}
            >
              <div
                className={cn(
                  "aspect-[2/3] w-24 shrink-0 rounded-md sm:w-28",
                  isGlass ? "bg-white/[0.04]" : "bg-muted",
                )}
              />
              <div className="min-w-0 flex-1 space-y-2 pt-1">
                <div
                  className={cn("h-5 w-2/3 rounded", isGlass ? "bg-white/[0.06]" : "bg-muted")}
                />
                <div
                  className={cn("h-3 w-24 rounded", isGlass ? "bg-white/[0.04]" : "bg-muted")}
                />
                <div
                  className={cn("h-16 w-full rounded", isGlass ? "bg-white/[0.04]" : "bg-muted")}
                />
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
          {showSectionTitle ? (
            <ProfileSectionHeader title={sectionTitle} glassMode="soft" />
          ) : null}
          {emptyFallback}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {showSectionTitle ? (
        <ProfileSectionHeader title={sectionTitle} glassMode="soft" />
      ) : null}

      <ul className="space-y-6">
        {reviews.map((review) => {
          const href = reviewHref(review)
          const year = review.release_date
            ? new Date(review.release_date).getFullYear()
            : null

          return (
            <li
              key={review.id}
              className={cn(
                "border-b pb-6 last:border-0 last:pb-0",
                isGlass ? "border-white/10" : "border-border",
              )}
            >
              <div className="flex gap-3 sm:gap-4">
                {href ? (
                  <Link href={href} className="shrink-0">
                    <div
                      className={cn(
                        "aspect-[2/3] w-24 overflow-hidden rounded-md border sm:w-28",
                        isGlass ? "border-white/10" : "border-black/20 dark:border-white/20",
                      )}
                    >
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
                ) : (
                  <div
                    className={cn(
                      "aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-md border sm:w-28",
                      isGlass ? "border-white/10" : "border-black/20 dark:border-white/20",
                    )}
                  >
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
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {href ? (
                        <Link href={href} className="group inline-flex flex-wrap items-baseline gap-2">
                          <h3
                            className={cn(
                              "text-lg font-medium transition-colors group-hover:text-brand sm:text-xl",
                              isGlass ? "text-white" : "text-foreground",
                            )}
                          >
                            {review.movie_title}
                          </h3>
                          {year ? (
                            <span
                              className={cn(
                                "text-sm",
                                isGlass ? "text-white/40" : "text-muted-foreground",
                              )}
                            >
                              {year}
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <h3
                          className={cn(
                            "inline-flex flex-wrap items-baseline gap-2 text-lg font-medium sm:text-xl",
                            isGlass ? "text-white" : "text-foreground",
                          )}
                        >
                          {review.movie_title}
                          {year ? (
                            <span
                              className={cn(
                                "text-sm",
                                isGlass ? "text-white/40" : "text-muted-foreground",
                              )}
                            >
                              {year}
                            </span>
                          ) : null}
                        </h3>
                      )}
                    </div>
                    <RatingStars
                      value={review.rating}
                      className="shrink-0"
                      starClassName="h-4 w-4"
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/${review.userData?.username}`}>
                      <Avatar
                        className={cn(
                          "h-7 w-7 rounded-md border",
                          isGlass ? "border-white/10" : "border-black/20 dark:border-white/20",
                        )}
                      >
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
                      className={cn(
                        "font-medium hover:text-[#e94e7a]",
                        isGlass ? "text-white/55" : "text-muted-foreground",
                      )}
                    >
                      {review.userData?.display_name || review.userData?.username}
                    </Link>
                    <span
                      className={cn(
                        "text-xs",
                        isGlass ? "text-white/40" : "text-muted-foreground/70",
                      )}
                    >
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-3 text-sm leading-relaxed whitespace-pre-wrap",
                      isGlass ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
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
