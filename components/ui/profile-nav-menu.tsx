"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import {
  Bell,
  Check,
  Eye,
  Globe,
  List,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound,
  Clapperboard,
} from "lucide-react"
import { FiUser } from "react-icons/fi"
import { RiLoginBoxLine } from "react-icons/ri"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsDialog } from "@/components/notifications/notifications-menu"
import { useNotifications } from "@/hooks/use-notifications"
import { useProfile } from "@/components/providers/profile-provider"
import { useAppearance } from "@/components/providers/appearance-provider"
import { useT } from "@/components/providers/i18n-provider"
import { profileAvatarPresentation } from "@/lib/profile-media"
import {
  avatarDisplaySrc,
  remoteImageSrcLooksLikeGif,
} from "@/lib/next-remote-image"
import {
  TMDB_LANGUAGE_OPTIONS,
  type TmdbLanguageId,
} from "@/lib/locale-prefs"
import {
  parseUserHomePreferences,
  serializeUserHomePreferencesKeepingBackdrop,
  type ColorModePreference,
} from "@/lib/user-home-preferences"
import { cn } from "@/lib/utils"

const menuItemClass = cn(
  "cursor-pointer gap-2.5 rounded-md text-foreground outline-none transition-colors",
  "focus:bg-muted focus:text-foreground",
  "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
  "data-[state=open]:bg-muted data-[state=open]:text-foreground",
  "[&_svg]:text-muted-foreground",
  "focus:[&_svg]:text-foreground",
  "data-[highlighted]:[&_svg]:text-foreground",
  "data-[state=open]:[&_svg]:text-foreground",
)

const iconClass = "size-4 shrink-0"

export function ProfileNavMenu() {
  const { t } = useT()
  const router = useRouter()
  const user = useUser()
  const supabase = useSupabaseClient()
  const { profile, loading, refreshProfile } = useProfile()
  const { colorModePreference, setColorMode } = useAppearance()
  const { unreadCount } = useNotifications()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const navAvatar = profile
    ? profileAvatarPresentation({
        avatar_url: profile.avatar_url,
        avatar_meta: profile.avatar_meta,
      })
    : null

  const prefs = parseUserHomePreferences(profile?.home_preferences ?? null)
  const currentLanguage = (prefs.tmdb_language ?? "pt-BR") as TmdbLanguageId
  const currentTheme = (colorModePreference ?? prefs.color_mode ?? "dark") as ColorModePreference

  const patchPrefs = async (partial: {
    tmdb_language?: TmdbLanguageId
    color_mode?: ColorModePreference
  }) => {
    if (!user?.id) return
    const nextPrefs = {
      ...parseUserHomePreferences(profile?.home_preferences ?? null),
      ...partial,
    }
    const payload = serializeUserHomePreferencesKeepingBackdrop(
      profile?.home_preferences ?? null,
      nextPrefs,
    )
    const { error } = await supabase
      .from("users")
      .update({ home_preferences: payload })
      .eq("id", user.id)
    if (error) {
      console.error(error)
      return
    }
    await refreshProfile()
  }

  const handleTheme = (mode: string) => {
    const next = mode as ColorModePreference
    setColorMode(next)
    void patchPrefs({ color_mode: next })
  }

  const handleLanguage = (lang: string) => {
    void patchPrefs({ tmdb_language: lang as TmdbLanguageId })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:size-12",
            "border border-border bg-muted/50 text-foreground",
            "ring-1 ring-inset ring-border/60",
            "transition hover:border-brand/25 hover:bg-brand/10 hover:text-brand-muted dark:hover:bg-brand/14 dark:hover:text-brand-light",
            "outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
            "data-[state=open]:border-border data-[state=open]:ring-1 data-[state=open]:ring-inset data-[state=open]:ring-border",
          )}
        >
          {!loading && (
            <>
              {navAvatar?.src && profile ? (
                <Image
                  src={avatarDisplaySrc(navAvatar.src) ?? navAvatar.src}
                  alt={profile.username}
                  width={48}
                  height={48}
                  unoptimized={remoteImageSrcLooksLikeGif(
                    avatarDisplaySrc(navAvatar.src) ?? navAvatar.src,
                  )}
                  className="h-full w-full object-cover"
                  style={
                    navAvatar.objectPosition
                      ? { objectPosition: navAvatar.objectPosition }
                      : undefined
                  }
                />
              ) : (
                <FiUser />
              )}
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-[100] min-w-[13.5rem] overflow-visible rounded-xl border border-border bg-popover p-1 shadow-2xl shadow-black/20 backdrop-blur-xl dark:shadow-black/50"
        >
          {profile ? (
            <>
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link href={`/${profile.username}`}>
                  <UserRound className={iconClass} aria-hidden />
                  {t("common.profile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link href={`/${profile.username}/watched`}>
                  <Clapperboard className={iconClass} aria-hidden />
                  {t("nav.watched")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link href={`/${profile.username}/watchlist`}>
                  <Eye className={iconClass} aria-hidden />
                  {t("nav.watchlist")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link href="/lists">
                  <List className={iconClass} aria-hidden />
                  {t("nav.lists")}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                className={menuItemClass}
                onSelect={(e) => {
                  e.preventDefault()
                  setNotificationsOpen(true)
                }}
              >
                <span className="relative">
                  <Bell className={iconClass} aria-hidden />
                  {unreadCount > 0 ? (
                    <span
                      className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-brand"
                      aria-hidden
                    />
                  ) : null}
                </span>
                {t("notifications.title")}
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={menuItemClass}>
                  <Sun className={cn(iconClass, "dark:hidden")} aria-hidden />
                  <Moon className={cn(iconClass, "hidden dark:block")} aria-hidden />
                  {t("prefs.colorMode")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={6}
                  className="z-[110] min-w-[9.5rem] rounded-xl border border-border bg-popover p-1 shadow-xl"
                >
                  {(
                    [
                      { value: "light", label: t("prefs.modeLight"), Icon: Sun },
                      { value: "dark", label: t("prefs.modeDark"), Icon: Moon },
                      { value: "system", label: t("prefs.modeSystem"), Icon: Monitor },
                    ] as const
                  ).map(({ value, label, Icon }) => (
                    <DropdownMenuItem
                      key={value}
                      className={menuItemClass}
                      onClick={() => handleTheme(value)}
                    >
                      <Icon className={iconClass} aria-hidden />
                      <span className="flex-1">{label}</span>
                      {currentTheme === value ? (
                        <Check className="size-3.5 opacity-70" aria-hidden />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className={menuItemClass}>
                  <Globe className={iconClass} aria-hidden />
                  {t("prefs.contentLanguage")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={6}
                  className="z-[110] min-w-[12rem] rounded-xl border border-border bg-popover p-1 shadow-xl"
                >
                  {TMDB_LANGUAGE_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.id}
                      className={menuItemClass}
                      onClick={() => handleLanguage(opt.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                      {currentLanguage === opt.id ? (
                        <Check className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem onClick={handleSignOut} className={menuItemClass}>
                <LogOut className={iconClass} aria-hidden />
                {t("common.signOut")}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem asChild className={menuItemClass}>
              <Link href="/sign-in">
                <RiLoginBoxLine className={iconClass} />
                {t("common.signIn")}
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {profile ? (
        <NotificationsDialog
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />
      ) : null}
    </>
  )
}
