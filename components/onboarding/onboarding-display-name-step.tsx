"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell"
import { onboardingContinueButtonClass } from "@/components/onboarding/onboarding-step-actions"
import {
  ContentLanguageSelect,
  WatchRegionSelect,
} from "@/components/profile/locale-pref-selects"
import type { TmdbLanguageId, WatchRegionId } from "@/lib/locale-prefs"
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

        <WatchRegionSelect
          id="onboarding-watch-region"
          label={t("onboarding.watchRegion")}
          value={watchRegion}
          onValueChange={onWatchRegionChange}
          hint={t("onboarding.watchRegionHint")}
          triggerClassName="h-11 border-border bg-muted/40 text-white"
        />

        <ContentLanguageSelect
          id="onboarding-tmdb-language"
          label={t("onboarding.contentLanguage")}
          value={tmdbLanguage}
          onValueChange={onTmdbLanguageChange}
          hint={t("onboarding.contentLanguageHint")}
          triggerClassName="h-11 border-border bg-muted/40 text-white"
        />
      </div>
    </OnboardingStepShell>
  )
}
