"use client"

import Link from "next/link"
import { useMemo } from "react"
import { MdEdit } from "react-icons/md"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfileMoreMenu } from "@/components/profile/profile-more-menu"
import { ProfileSocialLinks } from "@/components/profile/profile-social-links"
import { ProfileAtmosphere } from "@/components/profile/profile-atmosphere"
import { ProfileTabBarGlass } from "@/components/profile/profile-tab-bar-glass"
import {
  ProfileLayoutProvider,
  type ProfileLayoutUser,
} from "@/components/providers/profile-layout-context"
import { useProfile } from "@/components/providers/profile-provider"
import { ShiningBadge } from "@/components/premium/shining-badge"
import type { ProfileTabId } from "@/components/profile/profile-tab-bar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import type { Json } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"
import { glassProfileContainerClass } from "@/lib/page-container"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import { useT } from "@/components/providers/i18n-provider"
import {
  DEFAULT_ATMOSPHERE_MODE,
  DEFAULT_ATMOSPHERE_SOURCE,
  DEFAULT_GLASS_BANNER_LAYOUT,
  resolveAtmosphereCoverUrl,
} from "@/lib/atmosphere"
import { parseUserHomePreferences } from "@/lib/user-home-preferences"

type AvatarDisplay = {
  src: string | null
  objectPosition?: string
}

type BannerDisplay = {
  src: string
  backgroundPosition?: string
}

export type ProfileShellGlassProps = {
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

export function ProfileShellGlass({
  username,
  userData,
  isOwnProfile,
  isShiningProfile,
  showBanner,
  showRedrumBadge,
  bannerDisplay,
  avatarDisplay,
  activeTab,
  stats,
  sessionStripeCustomerId,
  onToggleFollow,
  onBlocked,
  onOpenAvatarEdit,
  onOpenBannerEdit,
  onUpdateProfile,
  onHomeBackdropUpdated,
  children,
}: ProfileShellGlassProps) {
  const { t } = useT()
  const { profile: viewerProfile } = useProfile()
  const viewerPrefs = useMemo(
    () => parseUserHomePreferences(viewerProfile?.home_preferences ?? null),
    [viewerProfile?.home_preferences],
  )
  const atmosphereMode = viewerPrefs.atmosphere_mode ?? DEFAULT_ATMOSPHERE_MODE
  const atmosphereSource = viewerPrefs.atmosphere_source ?? DEFAULT_ATMOSPHERE_SOURCE
  const bannerLayout = viewerPrefs.glass_banner_layout ?? DEFAULT_GLASS_BANNER_LAYOUT
  const bannerFull = showBanner && bannerLayout === "full"

  const displayName = userData.display_name || userData.username || ""
  const initials = (displayName.slice(0, 2) || "?").toUpperCase()
  const bio = userData.bio?.trim()
  const avatarSrc =
    avatarDisplaySrc(avatarDisplay.src, {
      allowGifPlayback: true,
    }) ?? null

  const atmosphereCoverUrl = resolveAtmosphereCoverUrl({
    source: atmosphereSource,
    bannerUrl: bannerDisplay.src,
    avatarUrl: avatarSrc,
    bannerVisible: showBanner,
  })

  const bannerNode = showBanner ? (
    <div
      className={cn(
        "group relative overflow-hidden bg-cover bg-center",
        bannerFull
          ? "h-44 w-full rounded-none sm:h-56 md:h-72 lg:h-96 xl:h-[420px]"
          : "h-56 w-full rounded-[18px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] sm:h-72 sm:rounded-[20px] md:h-80 lg:h-[360px]",
        isOwnProfile && "cursor-pointer",
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
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100",
            bannerFull ? "rounded-none" : "rounded-[18px] sm:rounded-[20px]",
          )}
        >
          <span className="text-sm font-medium text-white">{t("profile.editBanner")}</span>
        </button>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    </div>
  ) : null

  return (
    <section
      className={cn(
        "relative z-10 min-h-[70vh] w-full",
        "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))]",
      )}
    >
      <ProfileAtmosphere
        coverUrl={atmosphereCoverUrl}
        seed={userData.id || username}
        mode={atmosphereMode}
      />

      {bannerFull ? bannerNode : null}

      <div
        className={cn(
          glassProfileContainerClass,
          "relative z-[1] flex flex-col gap-8 pb-16 pt-4 sm:gap-10 sm:pt-6",
          !showBanner && "pt-6 sm:pt-8",
          bannerFull && showBanner && "-mt-12 sm:-mt-16 md:-mt-20",
        )}
      >
        {!bannerFull ? bannerNode : null}

        <header className={cn(
          "flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8",
          bannerFull && showBanner && "relative z-10",
        )}>
          <div className="group relative shrink-0">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt=""
                className="h-36 w-36 rounded-[18px] object-cover bg-white/10 shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)] sm:h-44 sm:w-44 sm:rounded-[20px]"
                style={
                  avatarDisplay.objectPosition
                    ? { objectPosition: avatarDisplay.objectPosition }
                    : undefined
                }
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-[18px] bg-white/[0.07] text-3xl font-medium tracking-tight text-white/70 sm:h-44 sm:w-44 sm:rounded-[20px] sm:text-4xl">
                {initials}
              </div>
            )}
            {isOwnProfile ? (
              <button
                type="button"
                onClick={onOpenAvatarEdit}
                className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 sm:rounded-[20px]"
              >
                <MdEdit className="h-6 w-auto text-white" />
              </button>
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[2rem] font-medium leading-none tracking-tight text-white sm:text-[2.5rem]">
                  {displayName}
                </h1>
                <p className="mt-2 inline-flex items-center gap-1.5 text-[15px] text-white/40">
                  <span>@{userData.username}</span>
                  {showRedrumBadge ? <ShiningBadge /> : null}
                </p>
              </div>
              {isOwnProfile ? (
                <LiquidGlass className="shrink-0 !rounded-full">
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
                      plan_current_period_end: userData.plan_current_period_end,
                    }}
                    stripeCustomerId={sessionStripeCustomerId}
                    onHomeBackdropUpdated={onHomeBackdropUpdated}
                    onUpdate={onUpdateProfile}
                    triggerClassName="px-4 py-2 text-sm font-medium text-white/85 transition hover:text-white"
                    triggerLabel={t("profile.editProfile")}
                  />
                </LiquidGlass>
              ) : (
                <div className="flex items-center gap-2">
                  <LiquidGlass className="shrink-0 !rounded-full">
                    <button
                      type="button"
                      onClick={onToggleFollow}
                      className={cn(
                        "px-4 py-2 text-sm font-medium transition",
                        stats.isFollowing
                          ? "text-white/60 hover:text-white"
                          : "text-white/85 hover:text-white",
                      )}
                    >
                      {stats.isFollowing ? t("profile.following") : t("profile.follow")}
                    </button>
                  </LiquidGlass>
                  <ProfileMoreMenu
                    profileUserId={userData.id}
                    username={userData.username}
                    onBlocked={onBlocked}
                  />
                </div>
              )}
            </div>

            {bio ? (
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-white/60">
                {bio}
              </p>
            ) : (
              <p className="mt-4 text-[15px] text-white/30">{t("profile.noBio")}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 text-[13px] text-white/40">
              <Link
                href={`/${userData.username}/followers`}
                className="transition hover:text-white/70"
              >
                <span className="font-semibold text-white/75">
                  {stats.followersCount}
                </span>{" "}
                {t("profile.followers")}
              </Link>
              <Link
                href={`/${userData.username}/following`}
                className="transition hover:text-white/70"
              >
                <span className="font-semibold text-white/75">
                  {stats.followingCount}
                </span>{" "}
                {t("profile.following")}
              </Link>
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
          </div>
        </header>

        <ProfileTabBarGlass
          username={username}
          activeTab={activeTab}
          badges={{
            watched: stats.filmsCount + stats.seriesCount,
          }}
        >
          <ProfileLayoutProvider
            value={{ userData, isOwnProfile, profileChrome: "glass" }}
          >
            <div className="text-foreground">{children}</div>
          </ProfileLayoutProvider>
        </ProfileTabBarGlass>
      </div>
    </section>
  )
}
