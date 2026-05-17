"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell"
import {
  onboardingContinueButtonClass,
  onboardingSecondaryButtonClass,
} from "@/components/onboarding/onboarding-step-actions"
import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image"
import { profileAvatarPresentation, profileBannerPresentation } from "@/lib/profile-media"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

/** Mesmo aspecto do crop de banner no editor (1152×487). */
const BANNER_ASPECT = "1152 / 487"

interface OnboardingMediaStepProps {
  displayName: string
  username: string
  avatarMeta: TmdbStoredImageMeta | null
  bannerMeta: TmdbStoredImageMeta | null
  onAvatarMetaChange: (meta: TmdbStoredImageMeta | null) => void
  onBannerMetaChange: (meta: TmdbStoredImageMeta | null) => void
  onContinue: () => void
  onSkip: () => void
}

export function OnboardingMediaStep({
  displayName,
  username,
  avatarMeta,
  bannerMeta,
  onAvatarMetaChange,
  onBannerMetaChange,
  onContinue,
  onSkip,
}: OnboardingMediaStepProps) {
  const [showAvatarEdit, setShowAvatarEdit] = useState(false)
  const [showBannerEdit, setShowBannerEdit] = useState(false)

  const avatarDisplay = profileAvatarPresentation({
    avatar_meta: avatarMeta,
    avatar_url: null,
  })
  const bannerDisplay = profileBannerPresentation({
    banner_meta: bannerMeta,
    banner_url: null,
  })

  const fallbackLetter = (displayName[0] || username[0] || "U").toUpperCase()

  const handleAvatarSave = useCallback(
    async (meta: TmdbStoredImageMeta) => {
      onAvatarMetaChange(meta)
    },
    [onAvatarMetaChange],
  )

  const handleBannerSave = useCallback(
    async (meta: TmdbStoredImageMeta) => {
      onBannerMetaChange(meta)
    },
    [onBannerMetaChange],
  )

  return (
    <>
      <OnboardingStepShell
        pinFooter
        title="Photo & banner"
        description="Pick a profile photo and banner so your page feels like you. You can set these later."
        className="max-w-xl"
        footer={
          <div className="flex flex-col items-center gap-2">
            <Button type="button" onClick={onContinue} className={onboardingContinueButtonClass}>
              Continue
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} className={onboardingSecondaryButtonClass}>
              Skip for now
            </Button>
          </div>
        }
      >
        <div className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e] ring-1 ring-white/[0.04]">
          <div
            className={cn(
              "relative w-full overflow-hidden bg-cover bg-center bg-no-repeat",
              !bannerMeta && "bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,0,72,0.12),transparent_55%)]",
            )}
            style={{
              aspectRatio: BANNER_ASPECT,
              maxHeight: "min(42vw, 240px)",
              ...(bannerMeta
                ? {
                    backgroundImage: `url(${bannerDisplay.src})`,
                    backgroundPosition: bannerDisplay.backgroundPosition,
                  }
                : {}),
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/35 to-transparent" />
            <button
              type="button"
              onClick={() => setShowBannerEdit(true)}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            >
              {bannerMeta ? "Change banner" : "Add banner"}
            </button>
          </div>

          <div className="-mt-12 flex flex-col items-center gap-3 px-4 pb-6">
            <button
              type="button"
              onClick={() => setShowAvatarEdit(true)}
              className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50"
            >
              <Avatar className="h-24 w-24 z-20 border-4 border-[#09090B] ring-2 ring-white/10">
                <AvatarImage
                  src={avatarDisplaySrc(avatarDisplay.src) ?? undefined}
                  alt=""
                  className="object-cover"
                  style={
                    avatarDisplay.objectPosition
                      ? { objectPosition: avatarDisplay.objectPosition }
                      : undefined
                  }
                />
                <AvatarFallback className="bg-muted text-2xl font-semibold">
                  {fallbackLetter}
                </AvatarFallback>
              </Avatar>
              <span className="absolute  inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {avatarMeta ? "Change" : "Add photo"}
              </span>
            </button>
            <p className="text-center text-sm font-medium text-white">
              {displayName.trim() || username}
            </p>
            <p className="text-xs text-zinc-500">@{username}</p>
          </div>
        </div>
      </OnboardingStepShell>

      {showAvatarEdit ? (
        <ImageEditDialog
          type="avatar"
          isOpen={showAvatarEdit}
          onClose={() => setShowAvatarEdit(false)}
          onSelect={() => {}}
          onSave={() => setShowAvatarEdit(false)}
          customTmdbMetaSave={handleAvatarSave}
        />
      ) : null}

      {showBannerEdit ? (
        <ImageEditDialog
          type="banner"
          isOpen={showBannerEdit}
          onClose={() => setShowBannerEdit(false)}
          onSelect={() => {}}
          onSave={() => setShowBannerEdit(false)}
          customTmdbMetaSave={handleBannerSave}
        />
      ) : null}
    </>
  )
}
