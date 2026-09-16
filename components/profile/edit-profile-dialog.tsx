import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { useDesignMode } from "@/hooks/use-design-mode"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useMemo, useRef } from "react"
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useProfile } from "@/components/providers/profile-provider"
import { useAppearance } from "@/components/providers/appearance-provider"
import { Settings, Link2, Pencil, ChevronRight, User, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Json } from "@/lib/supabase/database.types"
import { ConnectionsEditor } from "@/components/profile/connections-editor"
import { HomePreferencesEditor } from "@/components/profile/home-preferences-editor"
import { ProfileBioEditor } from "@/components/profile/profile-bio-editor"
import { ManageSubscription } from "@/components/premium/manage-subscription"
import type { PlanFields } from "@/lib/plans"
import {
  defaultSocialDisplayMap,
  mergeSocialDisplayIntoPreferencesJson,
  parseSocialDisplay,
  socialUrlsFromRecord,
  type SocialDisplayMap,
  type SocialUrls,
} from "@/lib/social-platforms"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import {
  defaultUserHomePreferences,
  extractHomeBackdropFromPreferences,
  parseUserHomePreferences,
  serializeUserHomePreferencesKeepingBackdrop,
  type UserHomePreferences,
} from "@/lib/user-home-preferences"
import { normalizeUsername } from "@/lib/onboarding"
import {
  checkUsernameAvailability,
  type UsernameAvailabilityStatus,
} from "@/lib/username-availability"
import { useT } from "@/components/providers/i18n-provider"

interface EditProfileDialogProps {
  username: string
  displayName?: string
  bio?: string
  /** Avatar atual (URL ou path) para o cabeçalho da sidebar. */
  avatarUrl?: string | null
  instagramUrl?: string | null
  twitterUrl?: string | null
  spotifyUrl?: string | null
  discordUrl?: string | null
  youtubeUrl?: string | null
  githubUrl?: string | null
  soundcloudUrl?: string | null
  pinterestUrl?: string | null
  telegramUrl?: string | null
  ethereumUrl?: string | null
  homePreferences?: Json | null
  planFields?: PlanFields
  stripeCustomerId?: string | null
  onHomeBackdropUpdated?: () => void | Promise<void>
  /** Override the default pencil-icon trigger (e.g. Glass “Editar perfil”). */
  triggerClassName?: string
  triggerLabel?: string
  onUpdate: (updates: {
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
}

type ProfileSectionId = "account" | "subscription" | "profile" | "preferences" | "social"

/** Fixed shell — sections scroll inside; modal size does not change per tab. */
const EDIT_PROFILE_MODAL_SIZE = cn(
  "h-[min(92vh,680px)] min-h-[min(92vh,680px)] max-h-[min(92vh,680px)]",
  "w-[min(96vw,920px)] min-w-[min(96vw,920px)] max-w-[min(96vw,920px)]",
)

export function EditProfileDialog({
  username,
  displayName,
  bio,
  avatarUrl,
  instagramUrl = null,
  twitterUrl = null,
  spotifyUrl = null,
  discordUrl = null,
  youtubeUrl = null,
  githubUrl = null,
  soundcloudUrl = null,
  pinterestUrl = null,
  telegramUrl = null,
  ethereumUrl = null,
  homePreferences = null,
  planFields = { plan: "free", plan_status: null, plan_current_period_end: null },
  stripeCustomerId = null,
  onHomeBackdropUpdated,
  triggerClassName,
  triggerLabel,
  onUpdate,
}: EditProfileDialogProps) {
  const { t } = useT()
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("account")
  const [loading, setLoading] = useState(false)
  const [newUsername, setNewUsername] = useState(username)
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameAvailabilityStatus>("idle")
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null)
  const usernameCheckSeq = useRef(0)
  const [newDisplayName, setNewDisplayName] = useState(displayName || "")
  const [newBio, setNewBio] = useState(bio || "")
  const [bioEditorKey, setBioEditorKey] = useState(0)
  const [socialUrls, setSocialUrls] = useState<SocialUrls>(() =>
    socialUrlsFromRecord({
      instagram_url: instagramUrl,
      twitter_url: twitterUrl,
      spotify_url: spotifyUrl,
      discord_url: discordUrl,
      youtube_url: youtubeUrl,
      github_url: githubUrl,
      soundcloud_url: soundcloudUrl,
      pinterest_url: pinterestUrl,
      telegram_url: telegramUrl,
      ethereum_url: ethereumUrl,
    }),
  )
  const [homePrefsDraft, setHomePrefsDraft] = useState<UserHomePreferences>(defaultUserHomePreferences)
  const [socialDisplay, setSocialDisplay] = useState<SocialDisplayMap>(defaultSocialDisplayMap)
  const { commitAppearanceSync } = useAppearance()
  const user = useUser()
  const { refreshProfile } = useProfile()

  const navGroups = useMemo((): {
    heading?: string
    items: { id: ProfileSectionId; label: string; Icon: typeof User }[]
  }[] => [
    {
      items: [
        { id: "account", label: t("profile.sectionAccount"), Icon: User },
        { id: "preferences", label: t("profile.sectionPreferences"), Icon: Settings },
        { id: "social", label: t("profile.sectionConnections"), Icon: Link2 },
        { id: "subscription", label: t("profile.sectionSubscription"), Icon: CreditCard },
      ],
    },
  ], [t])

  const sectionHeadings: Record<ProfileSectionId, string> = useMemo(
    () => ({
      account: t("profile.sectionAccount"),
      subscription: t("profile.sectionSubscription"),
      profile: t("profile.sectionProfile"),
      preferences: t("profile.sectionPreferences"),
      social: t("profile.sectionConnections"),
    }),
    [t],
  )

  const sectionHints: Record<ProfileSectionId, string> = useMemo(
    () => ({
      account: t("profile.hintAccount"),
      subscription: t("profile.hintSubscription"),
      profile: t("profile.hintProfile"),
      preferences: t("profile.hintPreferences"),
      social: t("profile.hintConnections"),
    }),
    [t],
  )

  useEffect(() => {
    if (!isOpen) return
    setNewUsername(username)
    setUsernameStatus("idle")
    setUsernameMessage(null)
    setNewDisplayName(displayName || "")
    setNewBio(bio || "")
    setSocialUrls(
      socialUrlsFromRecord({
        instagram_url: instagramUrl,
        twitter_url: twitterUrl,
        spotify_url: spotifyUrl,
        discord_url: discordUrl,
        youtube_url: youtubeUrl,
        github_url: githubUrl,
        soundcloud_url: soundcloudUrl,
        pinterest_url: pinterestUrl,
        telegram_url: telegramUrl,
        ethereum_url: ethereumUrl,
      }),
    )
    setHomePrefsDraft(parseUserHomePreferences(homePreferences))
    setSocialDisplay(parseSocialDisplay(homePreferences))
  }, [
    isOpen,
    username,
    displayName,
    bio,
    instagramUrl,
    twitterUrl,
    spotifyUrl,
    discordUrl,
    youtubeUrl,
    githubUrl,
    soundcloudUrl,
    pinterestUrl,
    telegramUrl,
    ethereumUrl,
    homePreferences,
  ])

  useEffect(() => {
    if (!isOpen) return
    setBioEditorKey((k) => k + 1)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const next = normalizeUsername(newUsername)
    if (!next || next === normalizeUsername(username)) {
      setUsernameStatus("idle")
      setUsernameMessage(null)
      return
    }

    setUsernameStatus("checking")
    setUsernameMessage(null)
    const seq = ++usernameCheckSeq.current
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await checkUsernameAvailability(supabase, next, {
          excludeUserId: user?.id,
        })
        if (seq !== usernameCheckSeq.current) return
        setUsernameStatus(result.status)
        setUsernameMessage(result.message)
      })()
    }, 350)

    return () => window.clearTimeout(timer)
  }, [isOpen, newUsername, username, supabase, user?.id])

  const homeBackdropFields = extractHomeBackdropFromPreferences(homePreferences)

  const usernameUnchanged =
    normalizeUsername(newUsername) === normalizeUsername(username)
  const usernameOk = usernameUnchanged || usernameStatus === "available"

  const handleSave = async () => {
    if (!user) return

    const nextUsername = normalizeUsername(newUsername)
    if (!usernameOk) {
      toast.error(usernameMessage || t("profile.usernameInvalid"))
      return
    }

    if (!usernameUnchanged) {
      const availability = await checkUsernameAvailability(supabase, nextUsername, {
        excludeUserId: user.id,
      })
      if (availability.status !== "available") {
        setUsernameStatus(availability.status)
        setUsernameMessage(availability.message)
        toast.error(availability.message || t("profile.usernameTaken"))
        return
      }
    }

    try {
      setLoading(true)
      const updates: Parameters<typeof onUpdate>[0] = {
        display_name: newDisplayName,
        bio: newBio,
        twitter_url: socialUrls.twitter_url ?? null,
        instagram_url: socialUrls.instagram_url ?? null,
        spotify_url: socialUrls.spotify_url ?? null,
        discord_url: socialUrls.discord_url ?? null,
        youtube_url: socialUrls.youtube_url ?? null,
        github_url: socialUrls.github_url ?? null,
        soundcloud_url: socialUrls.soundcloud_url ?? null,
        pinterest_url: socialUrls.pinterest_url ?? null,
        telegram_url: socialUrls.telegram_url ?? null,
        ethereum_url: socialUrls.ethereum_url ?? null,
        home_preferences: mergeSocialDisplayIntoPreferencesJson(
          serializeUserHomePreferencesKeepingBackdrop(homePreferences, homePrefsDraft),
          socialDisplay,
        ),
      }
      if (!usernameUnchanged) {
        updates.username = nextUsername
      }
      await onUpdate(updates)
      commitAppearanceSync()
      await refreshProfile()
      setIsOpen(false)
      if (!usernameUnchanged) {
        router.replace(`/${nextUsername}`)
        router.refresh()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : null
      if (code === "23505") {
        toast.error(t("profile.usernameTaken"))
      } else {
        toast.error(t("profile.usernameSaveError"))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    // Appearance (accent + light/dark) applies live and persists in localStorage —
    // do not revert it when closing the dialog without save.
    setIsOpen(open)
  }

  const showName = newDisplayName.trim() || username
  const avatarSrc = avatarDisplaySrc(avatarUrl ?? undefined) || undefined
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  const renderSectionContent = () => (
    <>
      {activeSection === "account" && (
        <div className="space-y-8">
          <div className={cn("space-y-4 rounded-xl border p-4 sm:p-5", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/5")}>
            <div>
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide", isGlass ? "text-white/40" : "text-muted-foreground")}>
                {t("profile.profileBasics")}
              </h3>
              <p className={cn("mt-1 text-sm", isGlass ? "text-white/60" : "text-muted-foreground")}>
                {t("profile.profileBasicsHint")}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="account-email"
                  className={cn("text-xs font-medium", isGlass ? "text-white/50" : "text-muted-foreground")}
                >
                  {t("profile.email")}
                </Label>
                <Input
                  id="account-email"
                  value={user?.email ?? ""}
                  disabled
                  className={cn("mt-1.5", isGlass ? "bg-white/[0.02] text-white/50 border-white/10" : "bg-muted/30")}
                />
                <p className={cn("mt-1 text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
                  {t("profile.emailHint")}
                </p>
              </div>
              <div>
                <Label
                  htmlFor="account-username"
                  className={cn("text-xs font-medium", isGlass ? "text-white/50" : "text-muted-foreground")}
                >
                  {t("profile.username")}
                </Label>
                <div className="relative mt-1.5">
                  <span className={cn("pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
                    @
                  </span>
                  <Input
                    id="account-username"
                    value={newUsername}
                    onChange={(e) =>
                      setNewUsername(
                        e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20),
                      )
                    }
                    autoComplete="off"
                    spellCheck={false}
                    className={cn("pl-7 lowercase", isGlass && "bg-white/[0.04] border-white/10 text-white")}
                    aria-invalid={
                      !usernameUnchanged &&
                      usernameStatus !== "idle" &&
                      usernameStatus !== "checking" &&
                      usernameStatus !== "available"
                    }
                  />
                </div>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    usernameStatus === "available"
                      ? "text-emerald-400"
                      : usernameStatus === "taken" ||
                          usernameStatus === "reserved" ||
                          usernameStatus === "invalid"
                        ? "text-red-400"
                        : isGlass
                          ? "text-white/40"
                          : "text-muted-foreground",
                  )}
                >
                  {usernameStatus === "checking"
                    ? t("profile.usernameChecking")
                    : usernameStatus === "available"
                      ? t("profile.usernameAvailable")
                      : usernameMessage || t("profile.usernameHint")}
                </p>
              </div>
              <div>
                <Label
                  htmlFor="account-displayName"
                  className={cn("text-xs font-medium", isGlass ? "text-white/50" : "text-muted-foreground")}
                >
                  {t("profile.displayName")}
                </Label>
                <Input
                  id="account-displayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder={t("profile.displayNamePlaceholder")}
                  className={cn("mt-1.5", isGlass && "bg-white/[0.04] border-white/10 text-white")}
                />
                <p className={cn("mt-1 text-xs", isGlass ? "text-white/40" : "text-muted-foreground")}>
                  {t("profile.displayNameHint")}
                </p>
              </div>
            </div>
          </div>

          <div className={cn("space-y-3 rounded-xl border p-4 sm:p-5", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/5")}>
            <div>
              <h3 className={cn("text-xs font-semibold uppercase tracking-wide", isGlass ? "text-white/40" : "text-muted-foreground")}>
                {t("profile.about")}
              </h3>
              <p className={cn("mt-1 text-sm", isGlass ? "text-white/60" : "text-muted-foreground")}>
                {t("profile.aboutHint")}
              </p>
            </div>
            <div>
              <Label className={cn("text-xs font-medium", isGlass ? "text-white/50" : "text-muted-foreground")}>
                {t("profile.bio")}
              </Label>
              {isOpen ? (
                <div className="mt-1.5">
                  <ProfileBioEditor
                    resetKey={bioEditorKey}
                    markdown={newBio}
                    onChange={setNewBio}
                    placeholder={t("profile.bioPlaceholder")}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {activeSection === "subscription" && (
        <div className={cn("rounded-xl border p-4 sm:p-5", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/40")}>
          <ManageSubscription
            embedded
            planFields={planFields}
            stripeCustomerId={stripeCustomerId}
          />
        </div>
      )}

      {activeSection === "preferences" && (
        <div className={cn("rounded-xl border p-4 sm:p-6 shadow-sm", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-card/40")}>
          <HomePreferencesEditor
            initialJson={homePreferences}
            onChange={setHomePrefsDraft}
            homeBackdropUrl={homeBackdropFields.url}
            homeBackdropMeta={homeBackdropFields.meta}
            onHomeBackdropUpdated={onHomeBackdropUpdated}
          />
        </div>
      )}

      {activeSection === "social" && (
        <ConnectionsEditor
          urls={socialUrls}
          onChange={setSocialUrls}
          display={socialDisplay}
          onDisplayChange={setSocialDisplay}
        />
      )}
    </>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            triggerClassName ??
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label={t("profile.editProfile")}
          title={t("profile.editProfile")}
        >
          {triggerLabel ? (
            <span>{triggerLabel}</span>
          ) : (
            <Pencil className="h-4 w-4" aria-hidden />
          )}
        </button>
      </DialogTrigger>

      {isGlass ? (
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[260] bg-black/60 backdrop-blur-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-[261] overflow-y-auto border-0 bg-transparent p-0 shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false)
            }}
          >
            <div className="mx-auto flex min-h-full w-full max-w-[var(--ck-glass-max-width-wide,1060px)] flex-col px-5 pb-20 pt-8 sm:px-8">
              {/* Header com Fechar e Salvar estilo Leitour */}
              <div className="mb-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  {t("common.cancel") || "Fechar"}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || !usernameOk || usernameStatus === "checking"}
                  className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                >
                  {loading ? t("profile.saving") : t("profile.saveChanges")}
                </button>
              </div>

              <DialogTitle className="sr-only">
                {t("profile.editProfile")}
              </DialogTitle>

              <div className="grid w-full gap-10 md:grid-cols-[minmax(0,240px)_1fr] md:items-start md:gap-14">
                {/* Coluna Esquerda: Avatar e Tabs de navegação estilo Leitour */}
                <aside className="mx-auto w-[min(100%,220px)] md:mx-0 md:w-full space-y-6">
                  <div className="group relative aspect-square w-full overflow-hidden rounded-[20px] bg-white/[0.06] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                    <Avatar className="h-full w-full rounded-[20px]">
                      <AvatarImage src={avatarSrc} alt="" className="h-full w-full object-cover" />
                      <AvatarFallback className="flex h-full w-full items-center justify-center bg-white/[0.06] text-2xl font-medium text-white/70">
                        {(showName[0] || username[0] || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div>
                    <p className="truncate text-base font-semibold text-white">{showName}</p>
                    <p className="truncate text-xs text-white/40">@{username}</p>
                  </div>

                  {/* Nav tabs estilo Leitour */}
                  <nav className="flex flex-col gap-1.5">
                    {navGroups[0].items.map((item) => {
                      const Icon = item.Icon
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition",
                            isActive
                              ? "bg-white/10 font-medium text-white ring-1 ring-white/10"
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                          )}
                        >
                          <Icon className={cn("size-4 shrink-0", isActive ? "text-white" : "text-white/40")} />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </aside>

                {/* Coluna Direita: Conteúdo da seção */}
                <div className="flex min-w-0 flex-col gap-6 text-white">
                  <div>
                    <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">
                      {sectionHeadings[activeSection]}
                    </h2>
                    <p className="mt-2 text-sm text-white/40">
                      {sectionHints[activeSection]}
                    </p>
                  </div>

                  <div className="min-h-0 flex-1">
                    {renderSectionContent()}
                  </div>
                </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      ) : (
        <DialogContent
          className={cn(
            "flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-background p-0 text-foreground shadow-lg sm:rounded-xl",
            EDIT_PROFILE_MODAL_SIZE,
            "[&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:inline-flex [&>button:last-child]:h-8 [&>button:last-child]:w-8 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-md [&>button:last-child]:p-0 [&>button:last-child]:text-muted-foreground [&>button:last-child]:opacity-70 [&>button:last-child]:hover:bg-transparent [&>button:last-child]:hover:text-muted-foreground [&>button:last-child]:hover:opacity-70 [&>button:last-child>svg]:size-4",
          )}
        >
          <div className="flex h-full min-h-0 flex-1 flex-col sm:flex-row">
            <aside className="custom-scrollbar flex shrink-0 flex-col gap-0 overflow-y-auto border-b border-border bg-muted/20 sm:h-full sm:w-[268px] sm:min-w-[268px] sm:border-b-0 sm:border-r sm:px-0 sm:py-0">
              <div className="px-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSection("account")}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-0",
                    activeSection === "account"
                      ? "border-border bg-muted/50"
                      : "border-border/80 bg-background/80 hover:border-border hover:bg-muted/40",
                  )}
                  aria-label={t("profile.editProfile")}
                >
                  <Avatar className="h-12 w-12 shrink-0 rounded-md border border-border shadow-sm">
                    <AvatarImage src={avatarSrc} alt="" className="rounded-md object-cover" />
                    <AvatarFallback className="rounded-md bg-muted text-sm font-medium text-muted-foreground">
                      {(showName[0] || username[0] || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">{showName}</p>
                    <p className="truncate text-xs text-muted-foreground">{t("profile.editProfile")}</p>
                  </div>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      activeSection === "account" ? "text-foreground" : "group-hover:translate-x-0.5",
                    )}
                    aria-hidden
                  />
                </button>
              </div>

              <div className="mx-2 my-2 h-px bg-border" aria-hidden />

              <nav className="flex flex-col gap-1 px-2 pb-2">
                {navGroups.map((group, gi) => (
                  <div key={gi} className="flex flex-col">
                    {group.heading ? (
                      <p className="px-2 pb-1.5 pt-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                        {group.heading}
                      </p>
                    ) : null}
                    <div className="flex flex-col gap-1">
                      {group.items.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveSection(id)}
                          className={cn(
                            "flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors",
                            activeSection === id
                              ? "bg-brand/10 font-medium text-brand-muted dark:bg-brand/14 dark:text-brand-light"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-background">
              <div className="shrink-0 border-b border-border px-6 pb-4 pt-11 sm:px-8 sm:pb-5 sm:pt-6 sm:pr-8">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  {sectionHeadings[activeSection]}
                </DialogTitle>
                <DialogDescription className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {sectionHints[activeSection]}
                </DialogDescription>
              </div>

              <div
                className={cn(
                  "custom-scrollbar min-h-0 flex-1 px-6 py-5 sm:px-8 sm:py-6",
                  activeSection === "subscription"
                    ? "overflow-y-visible"
                    : "overflow-y-auto",
                )}
              >
                {renderSectionContent()}
              </div>

              <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/10 px-5 py-3 sm:justify-end sm:px-8">
                <Button type="button" variant="outline" className="rounded-md" onClick={() => setIsOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="button"
                  className="rounded-md bg-brand px-5 text-white hover:bg-brand-hover"
                  onClick={handleSave}
                  disabled={loading || !usernameOk || usernameStatus === "checking"}
                >
                  {loading ? t("profile.saving") : t("profile.saveChanges")}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
