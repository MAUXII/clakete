"use client"

import Link from "next/link"
import { MdEdit } from "react-icons/md"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfileMoreMenu } from "@/components/profile/profile-more-menu"
import { ProfileSocialLinks } from "@/components/profile/profile-social-links"
import { ProfileTabBar, type ProfileTabId } from "@/components/profile/profile-tab-bar"
import {
  ProfileLayoutProvider,
  type ProfileLayoutUser,
} from "@/components/providers/profile-layout-context"
import { ShiningBadge } from "@/components/premium/shining-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import type { Json } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"
import { pageContainerClass } from "@/lib/page-container"
import { useT } from "@/components/providers/i18n-provider"

type AvatarDisplay = {
  src: string | null
  objectPosition?: string
}

type BannerDisplay = {
  src: string
  backgroundPosition?: string
}

/**
 * Nav (~4.5rem sm+) + folga.
 * Com banner: +6rem compensa o -mt do avatar (lg:-mt-24) pra coluna sticky
 * não ficar atrás da navbar. Sem banner: só nav + promo + folga.
 */
const profileSidebarStickyClass = (hasBanner: boolean) =>
  hasBanner
    ? "lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1rem_+_6rem)] lg:z-20"
    : "lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)_+_4.5rem_+_var(--clakete-promo-h,0px)_+_1rem)] lg:z-20"

export type ProfileShellClassicProps = {
  username: string
  userData: ProfileLayoutUser & {
    website_url?: string | null
    twitter_url?: string | null
    instagram_url?: string | null
    spotify_url?: string | null
    discord_url?: string | null
    youtube_url?: string | null
    github_url?: string | null
    soundcloud_url?: string | null
    pinterest_url?: string | null
    telegram_url?: string | null
    ethereum_url?: string | null
    home_preferences?: Json | null
    plan?: string
    plan_status?: string | null
    plan_current_period_end?: string | null
  }
  isOwnProfile: boolean
  isShiningProfile: boolean
  showBanner: boolean
  showRedrumBadge: boolean
  bannerDisplay: BannerDisplay
  avatarDisplay: AvatarDisplay
  activeTab: ProfileTabId
  themeClass: string | null
  stats: {
    filmsCount: number
    seriesCount: number
    followersCount: number
    followingCount: number
    isFollowing: boolean
  }
  sessionStripeCustomerId?: string | null
  onToggleFollow: () => void
  onBlocked: () => void
  onOpenAvatarEdit: () => void
  onOpenBannerEdit: () => void
  onUpdateProfile: (updates: {
    username?: string
    display_name?: string
    bio?: string
    twitter_url?: string | null
    instagram_url?: string | null
    spotify_url?: string | null
    discord_url?: string | null
    youtube_url?: string | null
    github_url?: string | null
    soundcloud_url?: string | null
    pinterest_url?: string | null
    telegram_url?: string | null
    ethereum_url?: string | null
    home_preferences?: Json | null
  }) => void | Promise<void>
  onHomeBackdropUpdated: () => void
  children: React.ReactNode
}

export function ProfileShellClassic({
  username,
  userData,
  isOwnProfile,
  isShiningProfile,
  showBanner,
  showRedrumBadge,
  bannerDisplay,
  avatarDisplay,
  activeTab,
  themeClass,
  stats,
  sessionStripeCustomerId,
  onToggleFollow,
  onBlocked,
  onOpenAvatarEdit,
  onOpenBannerEdit,
  onUpdateProfile,
  onHomeBackdropUpdated,
  children,
}: ProfileShellClassicProps) {
  const { t } = useT()
  const themed = Boolean(themeClass)

  return (
    <section
      className={cn(
        "relative z-10 mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] w-full",
        themeClass,
      )}
    >
      {showBanner ? (
        <div
          className={cn(
            "group relative h-44 w-full min-w-0 overflow-hidden rounded-none border-0 bg-cover bg-center ring-1 ring-border sm:h-56 md:h-72 lg:h-96 xl:h-[567px]",
            themed && "profile-theme-media-banner",
          )}
          style={{
            backgroundImage: `url(${bannerDisplay.src})`,
            backgroundPosition: bannerDisplay.backgroundPosition,
          }}
          onClick={() => isOwnProfile && onOpenBannerEdit()}
        >
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => onOpenBannerEdit()}
              className="absolute inset-0 z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-none bg-black/50 opacity-0 backdrop-blur-[1.2px] transition-opacity group-hover:opacity-100 "
            >
              <span className="text-white">{t("profile.editBanner")}</span>
            </button>
          ) : null}
          <div className="absolute inset-0 z rounded-none bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : null}

      <div className={cn(pageContainerClass, !showBanner && "pt-6 sm:pt-8")}>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <aside
            className={cn(
              profileSidebarStickyClass(showBanner),
              "flex w-full shrink-0 flex-col gap-6 self-start lg:w-[320px] xl:w-[340px]",
            )}
          >
                  <div
                    className={cn(
                      "group relative aspect-square size-24 overflow-clip rounded-2xl shadow-sm ring-2 ring-white dark:ring-[#090909] sm:size-32 md:size-36 lg:size-40",
                      showBanner && "-mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24",
                      themed && "profile-theme-media-avatar",
                    )}
                  >
                    <Avatar className="h-full w-full rounded-md shadow-none ">
                      <AvatarImage
                        src={
                          avatarDisplaySrc(avatarDisplay.src, {
                            allowGifPlayback: true,
                          }) || undefined
                        }
                        alt={userData.display_name || userData.username || ""}
                        className="object-cover"
                        style={
                          avatarDisplay.objectPosition
                            ? { objectPosition: avatarDisplay.objectPosition }
                            : undefined
                        }
                      />
                      <AvatarFallback className="flex w-full rounded-md text-2xl font-semibold">
                        {(
                          userData.display_name?.[0] ||
                          userData.username?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isOwnProfile ? (
                      <button
                        type="button"
                        onClick={onOpenAvatarEdit}
                        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10 opacity-0 backdrop-blur-[1.2px] transition-opacity group-hover:opacity-100"
                      >
                        <span className="text-white">
                          <MdEdit className="h-6 w-auto" />
                        </span>
                      </button>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-1 flex-col">
                    <h1
                      className={cn(
                        "text-3xl font-bold",
                        themed ? "profile-theme-name" : "dark:text-white",
                      )}
                    >
                      {userData.display_name || userData.username}
                    </h1>
                    <h2
                      className={cn(
                        "-mt-1 inline-flex items-center gap-1.5 text-lg",
                        themed ? "profile-theme-muted" : "text-muted-foreground",
                      )}
                    >
                      <span>@{userData.username}</span>
                      {showRedrumBadge ? <ShiningBadge /> : null}
                    </h2>

                    <div className="mt-2 flex w-full flex-col gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-xl font-semibold",
                              themed
                                ? "profile-theme-stat"
                                : "text-black dark:text-white",
                            )}
                          >
                            {stats.filmsCount}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              themed
                                ? "profile-theme-muted"
                                : "text-muted-foreground",
                            )}
                          >
                            {t("profile.films")}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "h-[61%] w-px shrink-0",
                            themed
                              ? "profile-theme-divider"
                              : "bg-muted-foreground/40",
                          )}
                        />

                        <div className="flex flex-col">
                          <span
                            className={cn(
                              "text-xl font-semibold",
                              themed
                                ? "profile-theme-stat"
                                : "text-black dark:text-white",
                            )}
                          >
                            {stats.seriesCount}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              themed
                                ? "profile-theme-muted"
                                : "text-muted-foreground",
                            )}
                          >
                            {t("profile.series")}
                          </span>
                        </div>

                        <div
                          className={cn(
                            "h-[61%] w-px shrink-0",
                            themed
                              ? "profile-theme-divider"
                              : "bg-muted-foreground/40",
                          )}
                        />

                        <Link
                          href={`/${userData.username}/followers`}
                          className="flex flex-col transition hover:opacity-80"
                        >
                          <span
                            className={cn(
                              "text-xl font-semibold",
                              themed
                                ? "profile-theme-stat"
                                : "text-black dark:text-white",
                            )}
                          >
                            {stats.followersCount}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              themed
                                ? "profile-theme-muted"
                                : "text-muted-foreground",
                            )}
                          >
                            {t("profile.followers")}
                          </span>
                        </Link>

                        <div
                          className={cn(
                            "h-[61%] w-px shrink-0",
                            themed
                              ? "profile-theme-divider"
                              : "bg-muted-foreground/40",
                          )}
                        />

                        <Link
                          href={`/${userData.username}/following`}
                          className="flex flex-col transition hover:opacity-80"
                        >
                          <span
                            className={cn(
                              "text-xl font-semibold",
                              themed
                                ? "profile-theme-stat"
                                : "text-black dark:text-white",
                            )}
                          >
                            {stats.followingCount}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              themed
                                ? "profile-theme-muted"
                                : "text-muted-foreground",
                            )}
                          >
                            {t("profile.following")}
                          </span>
                        </Link>

                        {isOwnProfile ? (
                          <div className="ml-auto shrink-0">
                            <EditProfileDialog
                              username={userData.username}
                              displayName={userData.display_name}
                              bio={userData.bio}
                              avatarUrl={userData.avatar_url ?? undefined}
                              instagramUrl={userData.instagram_url ?? null}
                              twitterUrl={userData.twitter_url ?? null}
                              spotifyUrl={userData.spotify_url ?? null}
                              discordUrl={userData.discord_url ?? null}
                              youtubeUrl={userData.youtube_url ?? null}
                              githubUrl={userData.github_url ?? null}
                              soundcloudUrl={userData.soundcloud_url ?? null}
                              pinterestUrl={userData.pinterest_url ?? null}
                              telegramUrl={userData.telegram_url ?? null}
                              ethereumUrl={userData.ethereum_url ?? null}
                              homePreferences={userData.home_preferences ?? null}
                              planFields={{
                                plan: userData.plan,
                                plan_status: userData.plan_status,
                                plan_current_period_end:
                                  userData.plan_current_period_end,
                              }}
                              stripeCustomerId={sessionStripeCustomerId}
                              onHomeBackdropUpdated={onHomeBackdropUpdated}
                              onUpdate={onUpdateProfile}
                            />
                          </div>
                        ) : null}
                      </div>

                      {!isOwnProfile ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onToggleFollow}
                            className={cn(
                              "flex h-9 min-w-0 flex-1 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors",
                              themed
                                ? "profile-theme-follow"
                                : stats.isFollowing
                                  ? "border-border bg-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                  : "border-brand/20 bg-brand/10 text-brand hover:bg-brand/15",
                            )}
                          >
                            {stats.isFollowing
                              ? t("profile.following")
                              : t("profile.follow")}
                          </button>
                          <ProfileMoreMenu
                            profileUserId={userData.id}
                            username={userData.username}
                            onBlocked={onBlocked}
                          />
                        </div>
                      ) : null}
                    </div>
                    <ProfileSocialLinks
                      className="mt-4"
                      social={{
                        instagram_url: userData.instagram_url,
                        twitter_url: userData.twitter_url,
                        spotify_url: userData.spotify_url,
                        discord_url: userData.discord_url,
                        youtube_url: userData.youtube_url,
                        github_url: userData.github_url,
                        soundcloud_url: userData.soundcloud_url,
                        pinterest_url: userData.pinterest_url,
                        telegram_url: userData.telegram_url,
                        ethereum_url: userData.ethereum_url,
                      }}
                      homePreferences={userData.home_preferences}
                    />
                    {userData.bio ? (
                      <p
                        className={cn(
                          "mt-4",
                          themed
                            ? "profile-theme-muted"
                            : "text-muted-foreground",
                        )}
                      >
                        {userData.bio}
                      </p>
                    ) : null}
                  </div>
          </aside>

          <div className="min-w-0 w-full flex-1">
            <ProfileTabBar username={username} activeTab={activeTab}>
              <ProfileLayoutProvider
                value={{ userData, isOwnProfile, profileChrome: "classic" }}
              >
                {children}
              </ProfileLayoutProvider>
            </ProfileTabBar>
          </div>
        </div>
      </div>
    </section>
  )
}
