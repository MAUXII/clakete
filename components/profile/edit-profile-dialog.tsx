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
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useUser } from "@supabase/auth-helpers-react"
import { useProfile } from "@/components/providers/profile-provider"
import { User, Settings, Link2, Pencil, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EditProfileDialogProps {
  username: string
  displayName?: string
  bio?: string
  websiteUrl?: string
  twitterUrl?: string
  instagramUrl?: string
  onUpdate: (updates: {
    display_name?: string
    bio?: string
    website_url?: string | null
    twitter_url?: string | null
    instagram_url?: string | null
  }) => void
}

type ProfileSectionId = "profile" | "preferences" | "social"

const NAV_GROUPS: {
  heading: string
  items: { id: ProfileSectionId; label: string; Icon: LucideIcon }[]
}[] = [
  {
    heading: "USER SETTINGS",
    items: [
      { id: "profile", label: "Profile", Icon: User },
      { id: "preferences", label: "Preferences", Icon: Settings },
      { id: "social", label: "Social links", Icon: Link2 },
    ],
  },
]

const SECTION_HEADINGS: Record<ProfileSectionId, string> = {
  profile: "Profile",
  preferences: "Preferences",
  social: "Social links",
}

const SECTION_HINTS: Record<ProfileSectionId, string> = {
  profile: "Update your display name and bio.",
  preferences: "More options will appear here over time.",
  social: "URLs for your website and social profiles.",
}

export function EditProfileDialog({
  username,
  displayName,
  bio,
  websiteUrl = "",
  twitterUrl = "",
  instagramUrl = "",
  onUpdate,
}: EditProfileDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("profile")
  const [loading, setLoading] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState(displayName || "")
  const [newBio, setNewBio] = useState(bio || "")
  const [linkWebsite, setLinkWebsite] = useState(websiteUrl || "")
  const [linkTwitter, setLinkTwitter] = useState(twitterUrl || "")
  const [linkInstagram, setLinkInstagram] = useState(instagramUrl || "")
  const user = useUser()
  const { refreshProfile } = useProfile()

  useEffect(() => {
    if (!isOpen) return
    setNewDisplayName(displayName || "")
    setNewBio(bio || "")
    setLinkWebsite(websiteUrl || "")
    setLinkTwitter(twitterUrl || "")
    setLinkInstagram(instagramUrl || "")
  }, [isOpen, displayName, bio, websiteUrl, twitterUrl, instagramUrl])

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
      })
      await refreshProfile()
      setIsOpen(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-300 transition-colors",
            "hover:border-[#FF0048]/35 hover:bg-[#FF0048]/10 hover:text-[#FF0048]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]",
          )}
          aria-label="Edit profile"
          title="Edit profile"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-[min(95vw,920px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <div className="flex min-h-[360px] flex-1 flex-col sm:flex-row">
          <aside className="scrollbar-thin flex max-h-[40vh] shrink-0 flex-row gap-1 overflow-x-auto overflow-y-auto border-b border-border bg-muted/40 px-2 py-3 sm:max-h-none sm:w-[220px] sm:flex-col sm:gap-0 sm:border-b-0 sm:border-r sm:px-0 sm:py-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.heading} className="mb-0 flex min-w-0 flex-row gap-1 sm:mb-2 sm:flex-col sm:px-2">
                <p className="hidden px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:block">
                  {group.heading}
                </p>
                {group.items.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors sm:w-full sm:rounded-sm",
                      activeSection === id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
            <div className="shrink-0 border-b border-border px-5 py-4 pr-12 pt-14 sm:py-6 sm:pr-5">
              <DialogTitle className="text-xl font-semibold">{SECTION_HEADINGS[activeSection]}</DialogTitle>
              <DialogDescription className="mt-1">{SECTION_HINTS[activeSection]}</DialogDescription>
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {activeSection === "profile" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} placeholder={username} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                      id="displayName"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="mt-2"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Shown on your profile instead of username when set.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={newBio}
                      onChange={(e) => setNewBio(e.target.value)}
                      placeholder="Tell people about yourself"
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {activeSection === "preferences" && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  No configurable preferences yet. Check back later.
                </div>
              )}

              {activeSection === "social" && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="social-website">Website</Label>
                    <Input
                      id="social-website"
                      value={linkWebsite}
                      onChange={(e) => setLinkWebsite(e.target.value)}
                      placeholder="https://"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social-twitter">X (Twitter)</Label>
                    <Input
                      id="social-twitter"
                      value={linkTwitter}
                      onChange={(e) => setLinkTwitter(e.target.value)}
                      placeholder="https://x.com/username"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="social-instagram">Instagram</Label>
                    <Input
                      id="social-instagram"
                      value={linkInstagram}
                      onChange={(e) => setLinkInstagram(e.target.value)}
                      placeholder="https://instagram.com/username"
                      className="mt-2"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t border-border bg-background px-5 py-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
