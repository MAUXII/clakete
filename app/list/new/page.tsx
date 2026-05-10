"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useUser } from "@supabase/auth-helpers-react"
import { ArrowLeft, Clock3 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell"
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { NewListGenreStep } from "@/components/list-new/new-list-genre-step"
import { NewListTagsStep } from "@/components/list-new/new-list-tags-step"
import {
  MIN_TITLES_TO_FINISH,
  NewListSwipeStep,
  type PickedMovie,
} from "@/components/list-new/new-list-swipe-step"
import type { ListBannerMeta } from "@/types/list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProfile } from "@/components/providers/profile-provider"
import { userProfilePath } from "@/lib/list-href"
import { profileAvatarPresentation } from "@/lib/profile-media"
import { playListFinishConfetti } from "@/lib/list-finish-confetti"
import { tmdbStoredImagePresentation } from "@/lib/tmdb-stored-image"

const LIST_BANNER_HEIGHT = "clamp(280px, min(46vh, 520px), 620px)"

const STEP3_BAR_IDLE_FRACTION = 0.08

type WizardStep = 1 | 2 | 3 | 4

export default function NewListPage() {
  const router = useRouter()
  const user = useUser()
  const { profile, loading: profileLoading } = useProfile()
  const [step, setStep] = useState<WizardStep>(1)

  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [bannerMeta, setBannerMeta] = useState<ListBannerMeta | null>(null)
  const [showBannerEdit, setShowBannerEdit] = useState(false)

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [pickedMovies, setPickedMovies] = useState<PickedMovie[]>([])
  const [canFinishSwipe, setCanFinishSwipe] = useState(false)

  const canContinueStep1 = title.trim().length > 0
  const canContinueStep2 = true
  const canContinueStep3 = selectedGenreIds.length >= 1
  const bannerPresentation = tmdbStoredImagePresentation(bannerMeta)

  const navAvatar = profile ? profileAvatarPresentation(profile) : null
  const creatorHandle = useMemo(() => {
    const u = profile?.username?.trim()
    if (u) return `@${u}`
    if (profileLoading) return "…"
    const emailLocal = user?.email?.split("@")[0]?.trim()
    if (emailLocal) return `@${emailLocal}`
    return "@you"
  }, [profile?.username, profileLoading, user?.email])

  const avatarFallbackLetter = (
    profile?.display_name?.[0] ||
    profile?.username?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase()

  const creatorUsername = profile?.username?.trim()
  const listByPillClass =
    "inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-2 pr-4 shadow-sm backdrop-blur-sm"
  const listByPillInner = (
    <>
      <Avatar className="h-11 w-11 border border-white/10 ring-2 ring-background shadow-md">
        <AvatarImage
          src={navAvatar?.src ?? undefined}
          alt={profile?.display_name || profile?.username || ""}
          style={
            navAvatar?.objectPosition ? { objectPosition: navAvatar.objectPosition } : undefined
          }
        />
        <AvatarFallback className="bg-muted text-sm font-semibold">{avatarFallbackLetter}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          List by
        </span>
        <span
          className={cn(
            "text-sm font-semibold text-foreground",
            creatorUsername && "transition-colors group-hover:text-[#e94e7a]",
          )}
        >
          {creatorHandle}
        </span>
      </div>
    </>
  )

  const moviesBarSemanticPct = Math.min(100, (pickedMovies.length / MIN_TITLES_TO_FINISH) * 100)
  const moviesBarFillPercent =
    pickedMovies.length >= MIN_TITLES_TO_FINISH
      ? 100
      : STEP3_BAR_IDLE_FRACTION * 100 +
        (pickedMovies.length / MIN_TITLES_TO_FINISH) * (1 - STEP3_BAR_IDLE_FRACTION) * 100

  const onAddPick = useCallback((item: PickedMovie) => {
    setPickedMovies((prev) => [...prev, item])
  }, [])

  const goBack = () => {
    if (step === 1) {
      router.push("/lists")
      return
    }
    setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))
  }

  const handleFinalize = () => {
    if (!canFinishSwipe) return
    playListFinishConfetti()
    toast.success("Draft ready — saving to your profile is coming soon.", {
      duration: 4000,
    })
    window.setTimeout(() => {
      router.push("/lists")
    }, 1600)
  }

  const mainClass =
    step === 4 || step === 1
      ? "flex h-dvh max-h-dvh flex-col overflow-hidden"
      : "min-h-screen overflow-y-auto pb-10"

  return (
    <main className={cn("w-full bg-[#09090B] text-zinc-100", mainClass)}>
      <FilmsCatalogShell compact={step === 4}>
        <header className="mb-5 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:text-white"
              aria-label={step === 1 ? "Back to lists" : "Previous step"}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            {step === 1 ? (
              <span className="hidden truncate text-[11px] font-medium text-zinc-500 sm:inline">
                Create new list
              </span>
            ) : null}
          </div>
          <div className="flex w-[200px] shrink-0 items-center gap-1.5 sm:w-[220px] sm:gap-2">
            {([1, 2, 3, 4] as const).map((s) => {
              if (s === 4 && step === 4) {
                return (
                  <div
                    key={s}
                    className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
                    role="progressbar"
                    aria-valuenow={Math.round(moviesBarSemanticPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Movies in list: ${pickedMovies.length} of ${MIN_TITLES_TO_FINISH}`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#FF0048] transition-[width] duration-300 ease-out"
                      style={{ width: `${moviesBarFillPercent}%` }}
                    />
                  </div>
                )
              }
              const filled = step > s || (step === s && s < 4)
              return (
                <div
                  key={s}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    filled ? "bg-[#FF0048]" : "bg-white/15",
                  )}
                />
              )
            })}
          </div>
        </header>

        {step === 1 ? (
          <>
            <div
              className="relative z-0 w-full overflow-hidden rounded-2xl border border-white/[0.12] bg-[#09090B]"
              style={{ height: LIST_BANNER_HEIGHT }}
            >
              {bannerPresentation ? (
                <img
                  src={bannerPresentation.src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: bannerPresentation.objectPosition }}
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]" />
              )}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/35 to-transparent" />
              <button
                type="button"
                onClick={() => setShowBannerEdit(true)}
                className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-black/45 opacity-0 backdrop-blur-[1.2px] transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <span className="text-sm font-medium text-white">
                  {bannerMeta ? "Update banner" : "Add banner"}
                </span>
              </button>
            </div>

            <header className="relative z-10 mt-6">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {creatorUsername ? (
                    <Link
                      href={userProfilePath(creatorUsername)}
                      className={cn(
                        listByPillClass,
                        "group transition-colors hover:border-[#e94e7a]/40 hover:bg-card",
                      )}
                    >
                      {listByPillInner}
                    </Link>
                  ) : (
                    <div className={listByPillClass}>{listByPillInner}</div>
                  )}

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    Draft
                  </span>
                </div>

                <form
                  autoComplete="off"
                  className="flex w-full flex-col gap-6"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    id="new-list-title"
                    name="clakete_new_list_title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome da lista"
                    maxLength={100}
                    type="text"
                    autoComplete="off"
                    className="w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-zinc-600 md:text-4xl"
                  />

                  <textarea
                    id="new-list-bio"
                    name="clakete_new_list_bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="List description"
                    rows={3}
                    maxLength={500}
                    autoComplete="off"
                    className="w-full max-w-3xl resize-none bg-transparent text-[15px] leading-relaxed text-muted-foreground outline-none placeholder:text-zinc-600 md:text-base"
                  />
                </form>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!canContinueStep1}
                    onClick={() => setStep(2)}
                    className={cn(
                      "h-10 min-w-[140px] rounded-full px-5 text-sm font-semibold transition-colors",
                      canContinueStep1
                        ? "bg-[#FF0048] text-white hover:bg-[#e60042]"
                        : "cursor-not-allowed bg-white/10 text-zinc-500",
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </header>
          </>
        ) : null}

        {step === 2 ? (
          <div className="mt-0">
            <NewListTagsStep selectedTags={selectedTags} onChangeSelected={setSelectedTags} />
            <div className="mx-auto mt-12 flex w-full max-w-2xl justify-end px-3 sm:px-4">
              <button
                type="button"
                disabled={!canContinueStep2}
                onClick={() => setStep(3)}
                className={cn(
                  "h-10 min-w-[140px] rounded-full px-5 text-sm font-semibold transition-colors",
                  canContinueStep2
                    ? "bg-[#FF0048] text-white hover:bg-[#e60042]"
                    : "cursor-not-allowed bg-white/10 text-zinc-500",
                )}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-0">
            <NewListGenreStep
              selectedIds={selectedGenreIds}
              onChangeSelected={setSelectedGenreIds}
            />
            <div className="mx-auto mt-12 flex w-full max-w-2xl justify-end px-3 sm:px-4">
              <button
                type="button"
                disabled={!canContinueStep3}
                onClick={() => setStep(4)}
                className={cn(
                  "h-10 min-w-[140px] rounded-full px-5 text-sm font-semibold transition-colors",
                  canContinueStep3
                    ? "bg-[#FF0048] text-white hover:bg-[#e60042]"
                    : "cursor-not-allowed bg-white/10 text-zinc-500",
                )}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-0">
            <NewListSwipeStep
              genreIds={selectedGenreIds}
              pickedCount={pickedMovies.length}
              onAddPick={onAddPick}
              onCanFinishChange={setCanFinishSwipe}
              canFinalize={canFinishSwipe}
              onFinalize={handleFinalize}
              compactLayout
            />
          </div>
        ) : null}

        {showBannerEdit ? (
          <ImageEditDialog
            isOpen={showBannerEdit}
            onClose={() => setShowBannerEdit(false)}
            onSave={() => {}}
            onSelect={() => {}}
            type="list"
            listId="draft-new-list"
            customListBannerSave={async (meta) => {
              setBannerMeta(meta)
            }}
          />
        ) : null}
      </FilmsCatalogShell>
    </main>
  )
}
