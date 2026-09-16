"use client"

import { Moon, Sun, Monitor, PanelsTopLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/ui/color-picker"
import { useAppearance } from "@/components/providers/appearance-provider"
import { BRAND_PRESETS, DEFAULT_BRAND_HEX, normalizeHex } from "@/lib/brand-accent"
import type {
  ColorModePreference,
  DesignMode,
} from "@/lib/user-home-preferences"
import {
  ATMOSPHERE_MODE_OPTIONS,
  DEFAULT_ATMOSPHERE_MODE,
  DEFAULT_ATMOSPHERE_SOURCE,
  DEFAULT_GLASS_BANNER_LAYOUT,
  type AtmosphereMode,
  type AtmosphereSource,
  type GlassBannerLayout,
} from "@/lib/atmosphere"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"

type AppearancePreferencesProps = {
  onAccentChange: (hex: string) => void
  onColorModeChange: (mode: ColorModePreference) => void
  designMode?: DesignMode
  onDesignModeChange?: (mode: DesignMode) => void
  showProfileBanner?: boolean
  onShowProfileBannerChange?: (on: boolean) => void
  showRedrumBadge?: boolean
  onShowRedrumBadgeChange?: (on: boolean) => void
  atmosphereMode?: AtmosphereMode
  onAtmosphereModeChange?: (mode: AtmosphereMode) => void
  atmosphereSource?: AtmosphereSource
  onAtmosphereSourceChange?: (source: AtmosphereSource) => void
  glassBannerLayout?: GlassBannerLayout
  onGlassBannerLayoutChange?: (layout: GlassBannerLayout) => void
  isShining?: boolean
}

export function AppearancePreferences({
  onAccentChange,
  onColorModeChange,
  designMode = "classic",
  onDesignModeChange,
  showProfileBanner = true,
  onShowProfileBannerChange,
  showRedrumBadge = true,
  onShowRedrumBadgeChange,
  atmosphereMode = DEFAULT_ATMOSPHERE_MODE,
  onAtmosphereModeChange,
  atmosphereSource = DEFAULT_ATMOSPHERE_SOURCE,
  onAtmosphereSourceChange,
  glassBannerLayout = DEFAULT_GLASS_BANNER_LAYOUT,
  onGlassBannerLayoutChange,
  isShining = false,
}: AppearancePreferencesProps) {
  const { t } = useT()
  const {
    accentHex,
    colorModePreference,
    setAccentHex,
    setColorMode,
    resetAccent,
  } = useAppearance()

  const colorMode: ColorModePreference = colorModePreference ?? "dark"

  const applyAccent = (raw: string) => {
    const hex = normalizeHex(raw)
    if (!hex) return
    setAccentHex(hex)
    onAccentChange(hex)
  }

  const applyMode = (mode: ColorModePreference) => {
    setColorMode(mode)
    onColorModeChange(mode)
  }

  const modes: { id: ColorModePreference; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("prefs.modeLight"), icon: Sun },
    { id: "dark", label: t("prefs.modeDark"), icon: Moon },
    { id: "system", label: t("prefs.modeSystem"), icon: Monitor },
  ]

  const designs: {
    id: DesignMode
    label: string
    hint: string
    icon: typeof PanelsTopLeft
  }[] = [
    {
      id: "classic",
      label: t("prefs.designClassic"),
      hint: t("prefs.designClassicHint"),
      icon: PanelsTopLeft,
    },
    {
      id: "glass",
      label: t("prefs.designGlass"),
      hint: t("prefs.designGlassHint"),
      icon: Sparkles,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="border-b border-border/60 pb-4">
        <h3 className="text-sm font-semibold text-foreground">{t("prefs.appearance")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("prefs.appearanceHint")}</p>
      </div>

      {onDesignModeChange ? (
        <div className="space-y-2">
          <Label className="text-sm font-normal">{t("prefs.designMode")}</Label>
          <p className="text-xs text-muted-foreground">{t("prefs.designModeHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {designs.map(({ id, label, hint, icon: Icon }) => {
              const selected = designMode === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onDesignModeChange(id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-md border px-3 py-3 text-left transition",
                    selected
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold">
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] leading-snug",
                      selected ? "text-brand/80" : "text-muted-foreground",
                    )}
                  >
                    {hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {onAtmosphereModeChange ? (
        <div className="space-y-2">
          <Label className="text-sm font-normal">{t("prefs.atmosphereMode")}</Label>
          <p className="text-xs text-muted-foreground">{t("prefs.atmosphereModeHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ATMOSPHERE_MODE_OPTIONS.map(({ id, labelKey, hintKey }) => {
              const selected = atmosphereMode === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onAtmosphereModeChange(id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition",
                    selected
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <span className="text-xs font-semibold">{t(labelKey)}</span>
                  <span
                    className={cn(
                      "text-[11px] leading-snug",
                      selected ? "text-brand/80" : "text-muted-foreground",
                    )}
                  >
                    {t(hintKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {onAtmosphereSourceChange && atmosphereMode !== "off" ? (
        <div className="space-y-2">
          <Label className="text-sm font-normal">{t("prefs.atmosphereSource")}</Label>
          <p className="text-xs text-muted-foreground">{t("prefs.atmosphereSourceHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  id: "banner" as const,
                  label: t("prefs.atmoSourceBanner"),
                  hint: t("prefs.atmoSourceBannerHint"),
                },
                {
                  id: "avatar" as const,
                  label: t("prefs.atmoSourceAvatar"),
                  hint: t("prefs.atmoSourceAvatarHint"),
                },
              ] as const
            ).map(({ id, label, hint }) => {
              const selected = atmosphereSource === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onAtmosphereSourceChange(id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition",
                    selected
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  <span
                    className={cn(
                      "text-[11px] leading-snug",
                      selected ? "text-brand/80" : "text-muted-foreground",
                    )}
                  >
                    {hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {onGlassBannerLayoutChange ? (
        <div className="space-y-2">
          <Label className="text-sm font-normal">{t("prefs.glassBannerLayout")}</Label>
          <p className="text-xs text-muted-foreground">{t("prefs.glassBannerLayoutHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  id: "contained" as const,
                  label: t("prefs.bannerContained"),
                  hint: t("prefs.bannerContainedHint"),
                },
                {
                  id: "full" as const,
                  label: t("prefs.bannerFull"),
                  hint: t("prefs.bannerFullHint"),
                },
              ] as const
            ).map(({ id, label, hint }) => {
              const selected = glassBannerLayout === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onGlassBannerLayoutChange(id)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-md border px-3 py-2.5 text-left transition",
                    selected
                      ? "border-brand/50 bg-brand/10 text-brand"
                      : "border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  <span
                    className={cn(
                      "text-[11px] leading-snug",
                      selected ? "text-brand/80" : "text-muted-foreground",
                    )}
                  >
                    {hint}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {onShowProfileBannerChange ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
            <div className="min-w-0">
              <Label
                htmlFor="show-profile-banner"
                className={cn(
                  "text-sm font-normal",
                  isShining ? "cursor-pointer" : "text-muted-foreground",
                )}
              >
                {t("prefs.showProfileBanner")}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isShining
                  ? t("prefs.showProfileBannerHint")
                  : t("prefs.showProfileBannerLocked")}
              </p>
              {!isShining ? (
                <p className="mt-1 text-xs">
                  <Link
                    href="/account/billing"
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    The Shining
                  </Link>
                </p>
              ) : null}
            </div>
            <Switch
              id="show-profile-banner"
              checked={Boolean(isShining && showProfileBanner)}
              disabled={!isShining}
              onCheckedChange={(v) => {
                if (!isShining) return
                onShowProfileBannerChange(v)
              }}
              className="data-[state=checked]:bg-brand"
            />
          </div>
        </div>
      ) : null}

      {onShowRedrumBadgeChange ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
            <div className="min-w-0">
              <Label
                htmlFor="show-redrum-badge"
                className={cn(
                  "text-sm font-normal",
                  isShining ? "cursor-pointer" : "text-muted-foreground",
                )}
              >
                {t("prefs.showRedrumBadge")}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isShining
                  ? t("prefs.showRedrumBadgeHint")
                  : t("prefs.showRedrumBadgeLocked")}
              </p>
            </div>
            <Switch
              id="show-redrum-badge"
              checked={Boolean(isShining && showRedrumBadge)}
              disabled={!isShining}
              onCheckedChange={(v) => {
                if (!isShining) return
                onShowRedrumBadgeChange(v)
              }}
              className="data-[state=checked]:bg-brand"
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-sm font-normal">{t("prefs.colorMode")}</Label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map(({ id, label, icon: Icon }) => {
            const selected = colorMode === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyMode(id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-xs font-medium transition",
                  selected
                    ? "border-brand/50 bg-brand/10 text-brand"
                    : "border-border/80 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label className="text-sm font-normal">{t("prefs.accentColor")}</Label>
          <div className="flex flex-wrap items-center gap-2">
            <ColorPicker
              value={accentHex}
              defaultFormat="hex"
              onValueChange={applyAccent}
            >
              <ColorPickerTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 border-border/80 px-2.5"
                >
                  <ColorPickerSwatch className="size-5 rounded-sm" />
                  <span className="font-mono text-xs uppercase">{accentHex}</span>
                </Button>
              </ColorPickerTrigger>
              <ColorPickerContent className="w-72 space-y-3 p-3">
                <ColorPickerArea />
                <ColorPickerHueSlider />
                <div className="flex items-center gap-2">
                  <ColorPickerFormatSelect />
                  <ColorPickerInput withoutAlpha className="min-w-0 flex-1" />
                  <ColorPickerEyeDropper />
                </div>
              </ColorPickerContent>
            </ColorPicker>
            {accentHex !== DEFAULT_BRAND_HEX ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  resetAccent()
                  onAccentChange(DEFAULT_BRAND_HEX)
                }}
              >
                {t("prefs.resetAccent")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {BRAND_PRESETS.map((preset) => {
            const selected = accentHex === preset.hex
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                aria-label={preset.label}
                onClick={() => applyAccent(preset.hex)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition",
                  selected ? "scale-110 border-foreground" : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: preset.hex }}
              />
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">{t("prefs.accentPresetsHint")}</p>
      </div>
    </div>
  )
}
