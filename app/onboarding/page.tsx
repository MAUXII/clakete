"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell"
import { OnboardingProgressHeader } from "@/components/onboarding/onboarding-progress-header"
import { OnboardingSplash } from "@/components/onboarding/onboarding-splash"
import { OnboardingDisplayNameStep } from "@/components/onboarding/onboarding-display-name-step"
import { OnboardingMediaStep } from "@/components/onboarding/onboarding-media-step"
import { OnboardingGenresStep } from "@/components/onboarding/onboarding-genres-step"
import {
  MIN_TITLES_TO_FINISH,
  NewListSwipeStep,
  type PickedMovie,
} from "@/components/list-new/new-list-swipe-step"
import { useProfile } from "@/components/providers/profile-provider"
import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image"
import type { Json } from "@/lib/supabase/database.types"
import { playListFinishConfetti } from "@/lib/list-finish-confetti"
import { setFavoriteGenresInsidePreferences } from "@/lib/user-home-preferences"
import { ONBOARDING_SWIPE_COPY } from "@/lib/onboarding-swipe-copy"

type OnboardingStep = 1 | 2 | 3 | 4

const STEP3_BAR_IDLE_FRACTION = 0.08

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const user = useUser()
  const { refreshProfile } = useProfile()

  const [showSplash, setShowSplash] = useState(true)
  const [step, setStep] = useState<OnboardingStep>(1)
  const [savedUsername, setSavedUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatarMeta, setAvatarMeta] = useState<TmdbStoredImageMeta | null>(null)
  const [bannerMeta, setBannerMeta] = useState<TmdbStoredImageMeta | null>(null)
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [watchedMovies, setWatchedMovies] = useState<PickedMovie[]>([])
  const [canFinishSwipe, setCanFinishSwipe] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.replace("/sign-in")
        return
      }

      const { data: profile } = await supabase
        .from("users")
        .select("username, display_name, avatar_meta, banner_meta, home_preferences")
        .eq("id", session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (!profile?.username) {
        router.replace("/sign-up")
        return
      }

      setSavedUsername(profile.username)
      if (profile.display_name) setDisplayName(profile.display_name)
      if (profile.avatar_meta && typeof profile.avatar_meta === "object") {
        setAvatarMeta(profile.avatar_meta as unknown as TmdbStoredImageMeta)
      }
      if (profile.banner_meta && typeof profile.banner_meta === "object") {
        setBannerMeta(profile.banner_meta as unknown as TmdbStoredImageMeta)
      }
      setReady(true)
    }

    void init()

    return () => {
      cancelled = true
    }
  }, [router, supabase])

  const goBack = () => {
    if (step === 1) {
      router.push("/")
      return
    }
    setStep((s) => (s > 1 ? ((s - 1) as OnboardingStep) : s))
  }

  const onAddWatched = useCallback((item: PickedMovie) => {
    setWatchedMovies((prev) => [...prev, item])
  }, [])

  const canContinueStep3 = selectedGenreIds.length >= 1

  const watchedBarSemanticPct = Math.min(
    100,
    (watchedMovies.length / MIN_TITLES_TO_FINISH) * 100,
  )
  const watchedBarFillPercent =
    watchedMovies.length >= MIN_TITLES_TO_FINISH
      ? 100
      : STEP3_BAR_IDLE_FRACTION * 100 +
        (watchedMovies.length / MIN_TITLES_TO_FINISH) *
          (1 - STEP3_BAR_IDLE_FRACTION) *
          100

  const completeOnboarding = useCallback(async () => {
    const authUser = user ?? (await supabase.auth.getSession()).data.session?.user

    if (!authUser?.id) {
      toast.error("You must be signed in to continue.")
      router.replace("/sign-in")
      return
    }

    setSaving(true)
    try {
      const { data: existing } = await supabase
        .from("users")
        .select("home_preferences")
        .eq("id", authUser.id)
        .maybeSingle()

      const homePreferences = setFavoriteGenresInsidePreferences(
        existing?.home_preferences ?? null,
        selectedGenreIds,
      )

      const { error: profileError } = await supabase
        .from("users")
        .update({
          display_name: displayName.trim() || null,
          avatar_meta: avatarMeta ? (avatarMeta as unknown as Json) : null,
          banner_meta: bannerMeta ? (bannerMeta as unknown as Json) : null,
          avatar_url: null,
          banner_url: null,
          home_preferences: homePreferences,
        })
        .eq("id", authUser.id)

      if (profileError) throw profileError

      if (watchedMovies.length > 0) {
        const now = new Date().toISOString()
        for (const film of watchedMovies) {
          const { error: interactionError } = await supabase.from("items_interactions").upsert(
            {
              user_id: authUser.id,
              tmdb_id: film.tmdb_id,
              media_type: film.media_type ?? "movie",
              is_watched: true,
              poster_path: film.poster_path ?? null,
              release_date: film.release_date ?? null,
              movie_title: film.title,
              updated_at: now,
            },
            { onConflict: "user_id,tmdb_id,media_type" },
          )
          if (interactionError) {
            console.error("Watched upsert error:", interactionError)
          }
        }
      }

      await refreshProfile()
      playListFinishConfetti()
      toast.success("Welcome to Clakete!")
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("Onboarding error:", err)
      toast.error("Could not save your profile. Try again.")
    } finally {
      setSaving(false)
    }
  }, [
    avatarMeta,
    bannerMeta,
    displayName,
    refreshProfile,
    router,
    selectedGenreIds,
    supabase,
    user,
    watchedMovies,
  ])

  if (!ready) {
    return (
      <main className="flex min-h-dvh w-full items-center justify-center bg-[#09090B] text-zinc-400">
        <p className="text-sm">Loading…</p>
      </main>
    )
  }

  const mainClass = "flex h-dvh max-h-dvh flex-col overflow-hidden"

  return (
    <>
      <OnboardingSplash visible={showSplash} onComplete={() => setShowSplash(false)} />

      {!showSplash ? (
        <main className={cn("w-full bg-[#09090B] text-zinc-100", mainClass)}>
          <FilmsCatalogShell compact className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col">
            <OnboardingProgressHeader
              step={step}
              totalSteps={4}
              onBack={goBack}
              filmsProgress={
                step === 4
                  ? {
                      count: watchedMovies.length,
                      min: MIN_TITLES_TO_FINISH,
                      fillPercent: watchedBarFillPercent,
                      semanticPercent: watchedBarSemanticPct,
                    }
                  : undefined
              }
            />

            {step === 1 ? (
              <div className="flex min-h-0 flex-1 flex-col py-2">
                <OnboardingDisplayNameStep
                  displayName={displayName}
                  username={savedUsername}
                  onDisplayNameChange={setDisplayName}
                  onContinue={() => setStep(2)}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex min-h-0 flex-1 flex-col py-2">
                <OnboardingMediaStep
                  displayName={displayName}
                  username={savedUsername}
                  avatarMeta={avatarMeta}
                  bannerMeta={bannerMeta}
                  onAvatarMetaChange={setAvatarMeta}
                  onBannerMetaChange={setBannerMeta}
                  onContinue={() => setStep(3)}
                  onSkip={() => setStep(3)}
                />
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex min-h-0 flex-1 flex-col py-2">
                <OnboardingGenresStep
                  selectedIds={selectedGenreIds}
                  onChangeSelected={setSelectedGenreIds}
                  canContinue={canContinueStep3}
                  onContinue={() => setStep(4)}
                />
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex min-h-0 flex-1 flex-col py-2">
                <NewListSwipeStep
                  genreIds={selectedGenreIds}
                  pickedCount={watchedMovies.length}
                  onAddPick={onAddWatched}
                  onCanFinishChange={setCanFinishSwipe}
                  canFinalize={canFinishSwipe}
                  onFinalize={() => void completeOnboarding()}
                  finalizeBusy={saving}
                  compactLayout
                  pinActionsFooter
                  copy={ONBOARDING_SWIPE_COPY}
                />
              </div>
            ) : null}
            </div>
          </FilmsCatalogShell>
        </main>
      ) : null}
    </>
  )
}
