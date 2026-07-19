"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import type { ColorModePreference } from "@/lib/user-home-preferences"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"

type AppearancePreferencesProps = {
  onAccentChange: (hex: string) => void
  onColorModeChange: (mode: ColorModePreference) => void
}

export function AppearancePreferences({
  onAccentChange,
  onColorModeChange,
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

  return (
    <div className="space-y-4">
      <div className="border-b border-border/60 pb-4">
        <h3 className="text-sm font-semibold text-foreground">{t("prefs.appearance")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("prefs.appearanceHint")}</p>
      </div>

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
