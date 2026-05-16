import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useUser } from "@supabase/auth-helpers-react"
import { useProfile } from "@/components/providers/profile-provider"
import { Settings, Link2, Pencil, ChevronRight, User, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Json } from "@/lib/supabase/database.types"
import { ConnectionsEditor } from "@/components/profile/connections-editor"
import { HomePreferencesEditor } from "@/components/profile/home-preferences-editor"
import { ProfileBioEditor } from "@/components/profile/profile-bio-editor"
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
  onHomeBackdropUpdated?: () => void | Promise<void>
  onUpdate: (updates: {
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
  }) => void
}

type ProfileSectionId = "account" | "profile" | "preferences" | "social"

const NAV_GROUPS: {
  heading?: string
  items: { id: ProfileSectionId; label: string; Icon: LucideIcon }[]
}[] = [
  {
    items: [
      { id: "account", label: "Account", Icon: User },
      { id: "preferences", label: "Preferences", Icon: Settings },
      { id: "social", label: "Connections", Icon: Link2 },
    ],
  },
]

const SECTION_HEADINGS: Record<ProfileSectionId, string> = {
  account: "Account",
  profile: "Profile",
  preferences: "Preferences",
  social: "Connections",
}

const SECTION_HINTS: Record<ProfileSectionId, string> = {
  account: "Your username and sign-in identity.",
  profile: "Display name and bio shown on your public profile. Markdown is supported in bio.",
  preferences: "Home backdrop and which sections appear after you sign in.",
  social: "Social platforms shown on your public profile.",
}

/** Fixed shell — sections scroll inside; modal size does not change per tab. */
const EDIT_PROFILE_MODAL_SIZE = cn(
  "h-[min(90vh,640px)] min-h-[min(90vh,640px)] max-h-[min(90vh,640px)]",
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
  onHomeBackdropUpdated,
  onUpdate,
}: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("account")
  const [loading, setLoading] = useState(false)
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
  const user = useUser()
  const { refreshProfile } = useProfile()

  useEffect(() => {
    if (!isOpen) return
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

  const homeBackdropFields = extractHomeBackdropFromPreferences(homePreferences)

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      await onUpdate({
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
      })
      await refreshProfile()
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const showName = newDisplayName.trim() || username
  const avatarSrc = avatarDisplaySrc(avatarUrl ?? undefined) || undefined

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label="Edit profile"
          title="Edit profile"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      </DialogTrigger>
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
                onClick={() => setActiveSection("profile")}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-0",
                  activeSection === "profile"
                    ? "border-border bg-muted/50"
                    : "border-border/80 bg-background/80 hover:border-border hover:bg-muted/40",
                )}
                aria-label="Edit profile details"
              >
                <Avatar className="h-12 w-12 shrink-0 rounded-md border border-border shadow-sm">
                  <AvatarImage src={avatarSrc} alt="" className="rounded-md object-cover" />
                  <AvatarFallback className="rounded-md bg-muted text-sm font-medium text-muted-foreground">
                    {(showName[0] || username[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">{showName}</p>
                  <p className="truncate text-xs text-muted-foreground">Edit profile</p>
                </div>
                <ChevronRight
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    activeSection === "profile" ? "text-foreground" : "group-hover:translate-x-0.5",
                  )}
                  aria-hidden
                />
              </button>
            </div>

            <div className="mx-2 my-2 h-px bg-border" aria-hidden />

            <nav className="flex flex-col gap-1 px-2 pb-2">
              {NAV_GROUPS.map((group, gi) => (
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
                            ? "bg-[#FF0048]/10 font-medium text-[#e8486b] dark:bg-[#FF0048]/14 dark:text-[#ff9eb0]"
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
                {SECTION_HEADINGS[activeSection]}
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {SECTION_HINTS[activeSection]}
              </DialogDescription>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
              {activeSection === "account" && (
                <div className="space-y-4 rounded-lg border border-border/80 bg-muted/5 p-4 sm:p-5">
                  <div>
                    <Label htmlFor="account-username" className="text-xs font-medium text-muted-foreground">
                      Username
                    </Label>
                    <Input
                      id="account-username"
                      value={username}
                      disabled
                      className="mt-1.5 bg-muted/30"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your username cannot be changed here.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "profile" && (
                <div className="space-y-8">
                  <div className="space-y-4 rounded-lg border border-border/80 bg-muted/5 p-4 sm:p-5">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Basics shown on your profile.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                          Username
                        </Label>
                        <Input id="username" value={username} disabled className="mt-1.5 bg-muted/30" />
                        <p className="mt-1 text-xs text-muted-foreground">Username can’t be changed here.</p>
                      </div>
                      <div>
                        <Label htmlFor="displayName" className="text-xs font-medium text-muted-foreground">
                          Display name
                        </Label>
                        <Input
                          id="displayName"
                          value={newDisplayName}
                          onChange={(e) => setNewDisplayName(e.target.value)}
                          placeholder="Your public name"
                          className="mt-1.5"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Shown in the header when set; otherwise your @handle is used.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border/80 bg-muted/5 p-4 sm:p-5">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">About</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Short bio. Markdown: bold, lists, links.</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
                      {isOpen ? (
                        <div className="mt-1.5">
                          <ProfileBioEditor
                            resetKey={bioEditorKey}
                            markdown={newBio}
                            onChange={setNewBio}
                            placeholder="Write a short bio… (**bold**, lists, links)"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "preferences" && (
                <div className="rounded-lg border border-border/80 bg-card/40 p-4 shadow-sm sm:p-6">
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
            </div>

            <DialogFooter className="shrink-0 gap-2 border-t border-border bg-muted/10 px-5 py-3 sm:justify-end sm:px-8">
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-md bg-[#FF0048] px-5 text-white hover:bg-[#e60042]"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
