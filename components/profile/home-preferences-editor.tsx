"use client"

import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import type { Json } from "@/lib/supabase/database.types"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  parseUserHomePreferences,
  setHomeBackdropInsidePreferences,
  type UserHomePreferences,
} from "@/lib/user-home-preferences"
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog"
import { useProfile } from "@/components/providers/profile-provider"
import { profileHomeBackdropPresentation } from "@/lib/profile-media"

export function HomePreferencesEditor({
  initialJson,
  onChange,
  homeBackdropUrl,
  homeBackdropMeta,
  onHomeBackdropUpdated,
}: {
  initialJson: Json | null | undefined
  onChange: (prefs: UserHomePreferences) => void
  homeBackdropUrl?: string | null
  homeBackdropMeta?: Json | null
  /** After saving/removing backdrop in the dialog — refreshes profile layout `userData`. */
  onHomeBackdropUpdated?: () => void | Promise<void>
}) {
  const [prefs, setPrefs] = useState<UserHomePreferences>(() =>
    parseUserHomePreferences(initialJson),
  )
  const [backdropPickerOpen, setBackdropPickerOpen] = useState(false)
  const user = useUser()
  const supabase = useSupabaseClient()
  const { refreshProfile } = useProfile()

  useEffect(() => {
    setPrefs(parseUserHomePreferences(initialJson))
  }, [initialJson])

  const backdropPreview = profileHomeBackdropPresentation({
    home_backdrop_url: homeBackdropUrl ?? null,
    home_backdrop_meta: homeBackdropMeta ?? null,
  })

  const update = (next: UserHomePreferences) => {
    setPrefs(next)
    onChange(next)
  }

  const clearBackdrop = async () => {
    if (!user?.id) return
    try {
      const { data: row, error: selErr } = await supabase
        .from("users")
        .select("home_preferences")
        .eq("id", user.id)
        .maybeSingle()
      if (selErr) throw selErr
      const next = setHomeBackdropInsidePreferences(row?.home_preferences ?? null, {
        url: null,
        meta: null,
      })
      const { error } = await supabase
        .from("users")
        .update({ home_preferences: next })
        .eq("id", user.id)
      if (error) throw error
      await refreshProfile()
      await onHomeBackdropUpdated?.()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">Home sections</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what appears on your logged-in home page.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-now" className="cursor-pointer text-sm font-normal">
            Now showing carousel
          </Label>
          <Switch
            id="home-now"
            checked={prefs.show_now_showing}
            onCheckedChange={(v) => update({ ...prefs, show_now_showing: v })}
            className="data-[state=checked]:bg-[#FF0048]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-up" className="cursor-pointer text-sm font-normal">
            Upcoming strip
          </Label>
          <Switch
            id="home-up"
            checked={prefs.show_upcoming}
            onCheckedChange={(v) => update({ ...prefs, show_upcoming: v })}
            className="data-[state=checked]:bg-[#FF0048]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-border/80 bg-background/50 px-4 py-3">
          <Label htmlFor="home-rev" className="cursor-pointer text-sm font-normal">
            Recent reviews
          </Label>
          <Switch
            id="home-rev"
            checked={prefs.show_recent_reviews}
            onCheckedChange={(v) => update({ ...prefs, show_recent_reviews: v })}
            className="data-[state=checked]:bg-[#FF0048]"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b border-border/60 pb-4">
          <h3 className="text-sm font-semibold text-foreground">Home backdrop</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Same flow as profile banner: pick a film from TMDB, choose a backdrop, crop. Stored as
            path + crop (no title or TMDB id in the database).
          </p>
        </div>

        <div className="overflow-hidden rounded-md border border-border/80 bg-muted/20">
          <div
            className="relative aspect-[1152/487] max-h-[140px] w-full bg-muted"
            style={
              backdropPreview
                ? {
                    backgroundImage: `url(${backdropPreview.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: backdropPreview.backgroundPosition,
                  }
                : undefined
            }
          >
            {!backdropPreview ? (
              <div className="flex h-full min-h-[100px] items-center justify-center text-xs text-muted-foreground">
                No backdrop
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setBackdropPickerOpen(true)}>
            Choose backdrop…
          </Button>
          {backdropPreview ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void clearBackdrop()}>
              Remove backdrop
            </Button>
          ) : null}
        </div>
      </div>

      <ImageEditDialog
        isOpen={backdropPickerOpen}
        onClose={() => setBackdropPickerOpen(false)}
        onSave={async () => {
          await refreshProfile()
          await onHomeBackdropUpdated?.()
          setBackdropPickerOpen(false)
        }}
        onSelect={() => {}}
        type="home_backdrop"
      />
    </div>
  )
}
