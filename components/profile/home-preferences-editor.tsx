"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import type { Json } from "@/lib/supabase/database.types"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  parseUserHomePreferences,
  setHomeBackdropInsidePreferences,
  type UserHomePreferences,
} from "@/lib/user-home-preferences"
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { useProfile } from "@/components/providers/profile-provider"
import { profileHomeBackdropPresentation } from "@/lib/profile-media"
import { useSubscription } from "@/hooks/use-subscription"
import { PROFILE_THEMES, type ProfileThemeId } from "@/lib/plans"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { AppearancePreferences } from "@/components/profile/appearance-preferences"
import type { ColorModePreference } from "@/lib/user-home-preferences"
import { useAppearance } from "@/components/providers/appearance-provider"
import {
  ContentLanguageSelect,
  WatchRegionSelect,
} from "@/components/profile/locale-pref-selects"

export function HomePreferencesEditor({
  initialJson,
  onChange,
  homeBackdropUrl,
  homeBackdropMeta,
  onHomeBackdropUpdated,
}: {
  initialJson: Json | null | undefined
  onChange: (prefs: UserHomePreferences) => void
  homeBackdropUrl?: string | null
  homeBackdropMeta?: Json | null
  /** After saving/removing backdrop in the dialog — refreshes profile layout `userData`. */
  onHomeBackdropUpdated?: () => void | Promise<void>
}) {
  const { t } = useT()
  const { accentHex, colorModePreference } = useAppearance()
  const [prefs, setPrefs] = useState<UserHomePreferences>(() =>
    parseUserHomePreferences(initialJson),
  )
  const [backdropPickerOpen, setBackdropPickerOpen] = useState(false)
  const user = useUser()
  const supabase = useSupabaseClient()
  const { refreshProfile } = useProfile()
  const { isShining } = useSubscription()

  useEffect(() => {
    const parsed = parseUserHomePreferences(initialJson)
    setPrefs({
      ...parsed,
      // Seed from live appearance so saving other prefs doesn't reset accent.
      accent_color: accentHex,
      color_mode: colorModePreference ?? parsed.color_mode ?? "dark",
    })
    // Only re-seed when the dialog source prefs change (open / refresh).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [initialJson])

  const backdropPreview = profileHomeBackdropPresentation({
    home_backdrop_url: homeBackdropUrl ?? null,
    home_backdrop_meta: homeBackdropMeta ?? null,
  })

  const update = (next: UserHomePreferences) => {
    setPrefs(next)
    onChange(next)
  }

  const setTheme = (id: ProfileThemeId) => {
    if (!isShining && id !== "default") return
    update({ ...prefs, profile_theme: id })
  }

  const clearBackdrop = async () => {
    if (!user?.id) return
    try {
      const { data: row, error: selErr } = await supabase
        .from("users")
        .select("home_preferences")
        .eq("id", user.id)
        .maybeSingle()
      if (selErr) throw selErr
      const next = setHomeBackdropInsidePreferences(row?.home_preferences ?? null, {
        url: null,
        meta: null,
      })
      const { error } = await supabase
        .from("users")
        .update({ home_preferences: next })
        .eq("id", user.id)
      if (error) throw error
      await refreshProfile()
      await onHomeBackdropUpdated?.()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-10">
      <AppearancePreferences
        onAccentChange={(hex) => update({ ...prefs, accent_color: hex })}
        onColorModeChange={(mode: ColorModePreference) =>
          update({ ...prefs, color_mode: mode })
        }
      />

      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">{t("prefs.homeSections")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("prefs.homeSectionsHint")}</p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-now" className="cursor-pointer text-sm font-normal">
            {t("prefs.nowShowing")}
          </Label>
          <Switch
            id="home-now"
            checked={prefs.show_now_showing}
            onCheckedChange={(v) => update({ ...prefs, show_now_showing: v })}
            className="data-[state=checked]:bg-brand"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-up" className="cursor-pointer text-sm font-normal">
            {t("prefs.upcoming")}
          </Label>
          <Switch
            id="home-up"
            checked={prefs.show_upcoming}
            onCheckedChange={(v) => update({ ...prefs, show_upcoming: v })}
            className="data-[state=checked]:bg-brand"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-feed" className="cursor-pointer text-sm font-normal">
            {t("prefs.followingFeed")}
          </Label>
          <Switch
            id="home-feed"
            checked={prefs.show_following_feed}
            onCheckedChange={(v) => update({ ...prefs, show_following_feed: v })}
            className="data-[state=checked]:bg-brand"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-rev" className="cursor-pointer text-sm font-normal">
            {t("prefs.recentReviews")}
          </Label>
          <Switch
            id="home-rev"
            checked={prefs.show_recent_reviews}
            onCheckedChange={(v) => update({ ...prefs, show_recent_reviews: v })}
            className="data-[state=checked]:bg-brand"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">{t("prefs.regionLanguage")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("prefs.regionLanguageHint")}</p>
        </div>

        <WatchRegionSelect
          id="watch-region"
          label={t("prefs.watchRegion")}
          value={prefs.watch_region ?? "BR"}
          onValueChange={(watch_region) => update({ ...prefs, watch_region })}
        />

        <ContentLanguageSelect
          id="tmdb-language"
          label={t("prefs.contentLanguage")}
          value={prefs.tmdb_language ?? "pt-BR"}
          onValueChange={(tmdb_language) => update({ ...prefs, tmdb_language })}
        />
      </div>

      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t("prefs.profileTheme")}</h3>
            <span className="rounded-md bg-brand/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
              {t("prefs.earlyAccess")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("prefs.themeHint")}</p>
        </div>

        {!isShining ? (
          <p className="rounded-md border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {t("prefs.unlockShiningBefore")}
            <Link href="/account/billing" className="font-medium text-brand underline-offset-2 hover:underline">
              The Shining
            </Link>
            {t("prefs.unlockShiningAfter")}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {PROFILE_THEMES.map((theme) => {
            const selected = (prefs.profile_theme ?? "default") === theme.id
            const locked = !isShining && theme.id !== "default"
            return (
              <button
                key={theme.id}
                type="button"
                disabled={locked}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  "rounded-md border px-4 py-3 text-left transition",
                  selected
                    ? "border-brand/50 bg-brand/10"
                    : "border-border/80 bg-background/50 hover:border-border",
                  locked && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="block text-sm font-medium text-foreground">{theme.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{theme.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">{t("prefs.homeBackdrop")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("prefs.backdropHint")}</p>
        </div>

        <div className="overflow-hidden rounded-md border border-border/80 bg-muted/20">
          <div
            className="relative aspect-[1152/487] max-h-[140px] w-full bg-muted"
            style={
              backdropPreview
                ? {
                    backgroundImage: `url(${backdropPreview.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: backdropPreview.backgroundPosition,
                  }
                : undefined
            }
          >
            {!backdropPreview ? (
              <div className="flex h-full min-h-[100px] items-center justify-center text-xs text-muted-foreground">
                {t("prefs.noBackdrop")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setBackdropPickerOpen(true)}>
            {t("prefs.chooseBackdrop")}
          </Button>
          {backdropPreview ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void clearBackdrop()}>
              {t("prefs.removeBackdrop")}
            </Button>
          ) : null}
        </div>
      </div>

      <ImageEditDialog
        isOpen={backdropPickerOpen}
        onClose={() => setBackdropPickerOpen(false)}
        onSave={async () => {
          await refreshProfile()
          await onHomeBackdropUpdated?.()
          setBackdropPickerOpen(false)
        }}
        onSelect={() => {}}
        type="home_backdrop"
      />
    </div>
  )
}
