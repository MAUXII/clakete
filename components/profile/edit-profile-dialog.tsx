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
import { Settings, Link2, Pencil, ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Json } from "@/lib/supabase/database.types"
import { HomePreferencesEditor } from "@/components/profile/home-preferences-editor"
import { ProfileBioEditor } from "@/components/profile/profile-bio-editor"
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
  websiteUrl?: string
  twitterUrl?: string
  instagramUrl?: string
  homePreferences?: Json | null
  onHomeBackdropUpdated?: () => void | Promise<void>
  onUpdate: (updates: {
    display_name?: string
    bio?: string
    website_url?: string | null
    twitter_url?: string | null
    instagram_url?: string | null
    home_preferences?: Json | null
  }) => void
}

type ProfileSectionId = "profile" | "preferences" | "social"

const NAV_GROUPS: {
  heading?: string
  items: { id: ProfileSectionId; label: string; Icon: LucideIcon }[]
}[] = [
  {
    items: [
      { id: "preferences", label: "Preferences", Icon: Settings },
      { id: "social", label: "Connections", Icon: Link2 },
    ],
  },
]

const SECTION_HEADINGS: Record<ProfileSectionId, string> = {
  profile: "Profile",
  preferences: "Preferences",
  social: "Connections",
}

const SECTION_HINTS: Record<ProfileSectionId, string> = {
  profile: "Display name, username, and bio. Markdown is supported.",
  preferences: "Home backdrop and which sections appear after you sign in.",
  social: "Website and social links shown on your public profile.",
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
  websiteUrl = "",
  twitterUrl = "",
  instagramUrl = "",
  homePreferences = null,
  onHomeBackdropUpdated,
  onUpdate,
}: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("profile")
  const [loading, setLoading] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(displayName || "")
  const [newBio, setNewBio] = useState(bio || "")
  const [bioEditorKey, setBioEditorKey] = useState(0)
  const [linkWebsite, setLinkWebsite] = useState(websiteUrl || "")
  const [linkTwitter, setLinkTwitter] = useState(twitterUrl || "")
  const [linkInstagram, setLinkInstagram] = useState(instagramUrl || "")
  const [homePrefsDraft, setHomePrefsDraft] = useState<UserHomePreferences>(defaultUserHomePreferences)
  const user = useUser()
  const { refreshProfile } = useProfile()

  useEffect(() => {
    if (!isOpen) return
    setNewDisplayName(displayName || "")
    setNewBio(bio || "")
    setLinkWebsite(websiteUrl || "")
    setLinkTwitter(twitterUrl || "")
    setLinkInstagram(instagramUrl || "")
    setHomePrefsDraft(parseUserHomePreferences(homePreferences))
  }, [isOpen, displayName, bio, websiteUrl, twitterUrl, instagramUrl, homePreferences])

  useEffect(() => {
    if (!isOpen) return
    setBioEditorKey((k) => k + 1)
  }, [isOpen])

  const homeBackdropFields = extractHomeBackdropFromPreferences(homePreferences)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      await onUpdate({
        display_name: newDisplayName,
        bio: newBio,
        website_url: linkWebsite.trim() || null,
        twitter_url: linkTwitter.trim() || null,
        instagram_url: linkInstagram.trim() || null,
        home_preferences: serializeUserHomePreferencesKeepingBackdrop(
          homePreferences,
          homePrefsDraft,
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
          "[&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:h-8 [&>button:last-child]:w-8 [&>button:last-child]:rounded-md [&>button:last-child]:text-muted-foreground [&>button:last-child]:hover:bg-muted [&>button:last-child]:hover:text-foreground",
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
                  <p className="truncate text-xs text-muted-foreground">@{username}</p>
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
                <div className="space-y-4 rounded-lg border border-border/80 bg-muted/5 p-4 sm:p-5">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Links</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Optional URLs. Leave blank to hide a link on your profile.
                    </p>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="social-website" className="text-xs font-medium text-muted-foreground">
                        Website
                      </Label>
                      <Input
                        id="social-website"
                        value={linkWebsite}
                        onChange={(e) => setLinkWebsite(e.target.value)}
                        placeholder="https://"
                        className="bg-background/80"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social-twitter" className="text-xs font-medium text-muted-foreground">
                        X (Twitter)
                      </Label>
                      <Input
                        id="social-twitter"
                        value={linkTwitter}
                        onChange={(e) => setLinkTwitter(e.target.value)}
                        placeholder="https://x.com/username"
                        className="bg-background/80"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social-instagram" className="text-xs font-medium text-muted-foreground">
                        Instagram
                      </Label>
                      <Input
                        id="social-instagram"
                        value={linkInstagram}
                        onChange={(e) => setLinkInstagram(e.target.value)}
                        placeholder="https://instagram.com/username"
                        className="bg-background/80"
                      />
                    </div>
                  </div>
                </div>
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
