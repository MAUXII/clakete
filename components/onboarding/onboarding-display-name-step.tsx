"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell"
import { onboardingContinueButtonClass } from "@/components/onboarding/onboarding-step-actions"
import {
  TMDB_LANGUAGE_OPTIONS,
  WATCH_REGION_OPTIONS,
  type TmdbLanguageId,
  type WatchRegionId,
} from "@/lib/locale-prefs"
import { translate } from "@/lib/i18n"

interface OnboardingDisplayNameStepProps {
  displayName: string
  username: string
  watchRegion: WatchRegionId
  tmdbLanguage: TmdbLanguageId
  onDisplayNameChange: (value: string) => void
  onWatchRegionChange: (value: WatchRegionId) => void
  onTmdbLanguageChange: (value: TmdbLanguageId) => void
  onContinue: () => void
}

export function OnboardingDisplayNameStep({
  displayName,
  username,
  watchRegion,
  tmdbLanguage,
  onDisplayNameChange,
  onWatchRegionChange,
  onTmdbLanguageChange,
  onContinue,
}: OnboardingDisplayNameStepProps) {
  /** Live preview: follows the language selected on this step (not yet saved). */
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(tmdbLanguage, key, vars)

  return (
    <OnboardingStepShell
      pinFooter
      title={t("onboarding.whatToCallYou")}
      description={t("onboarding.nameHint")}
      footer={
        <Button type="button" onClick={onContinue} className={onboardingContinueButtonClass}>
          {t("common.continue")}
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-md space-y-5 text-left">
        <div className="space-y-2 text-center">
          <Input
            id="onboarding-display-name"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder={username}
            maxLength={50}
            className="border-border bg-muted/40 py-6 text-center text-white placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter") onContinue()
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-watch-region" className="text-sm text-muted-foreground">
            {t("onboarding.watchRegion")}
          </Label>
          <select
            id="onboarding-watch-region"
            value={watchRegion}
            onChange={(e) => onWatchRegionChange(e.target.value as WatchRegionId)}
            className="flex h-11 w-full rounded-md border border-border bg-muted/40 px-3 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-brand/40"
          >
            {WATCH_REGION_OPTIONS.map((region) => (
              <option key={region.id} value={region.id} className="bg-card text-white">
                {region.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t("onboarding.watchRegionHint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboarding-tmdb-language" className="text-sm text-muted-foreground">
            {t("onboarding.contentLanguage")}
          </Label>
          <select
            id="onboarding-tmdb-language"
            value={tmdbLanguage}
            onChange={(e) => onTmdbLanguageChange(e.target.value as TmdbLanguageId)}
            className="flex h-11 w-full rounded-md border border-border bg-muted/40 px-3 text-sm text-white outline-none focus-visible:ring-1 focus-visible:ring-brand/40"
          >
            {TMDB_LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.id} value={lang.id} className="bg-card text-white">
                {lang.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t("onboarding.contentLanguageHint")}</p>
        </div>
      </div>
    </OnboardingStepShell>
  )
}
