"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useT } from "@/components/providers/i18n-provider"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { createNotification } from "@/lib/notifications"
import { cn } from "@/lib/utils"

type SuggestedUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function HomeFeedWhoToFollow({ limit = 4 }: { limit?: number }) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const [people, setPeople] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!authUser?.id) {
      setPeople([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data: follows, error: followsError } = await supabase
        .from("user_followers")
        .select("user_id")
        .eq("follower_id", authUser.id)

      if (followsError) throw followsError

      const exclude = new Set(
        (follows ?? [])
          .map((r) => r.user_id as string)
          .filter(Boolean)
          .concat(authUser.id),
      )

      const { data: rows, error } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .not("username", "is", null)
        .neq("id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(Math.max(limit * 6, 36))

      if (error) throw error

      const suggestions = (rows ?? [])
        .filter(
          (u): u is SuggestedUser =>
            Boolean(u.id && u.username) && !exclude.has(u.id as string),
        )
        .slice(0, limit)
        .map((u) => ({
          id: u.id as string,
          username: u.username as string,
          display_name: (u.display_name as string | null) ?? null,
          avatar_url: (u.avatar_url as string | null) ?? null,
        }))

      setPeople(suggestions)
    } catch (e) {
      console.error("[who-to-follow]", e)
      setPeople([])
    } finally {
      setLoading(false)
    }
  }, [authUser?.id, limit, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const follow = async (person: SuggestedUser) => {
    if (!authUser?.id || busyId) return
    setBusyId(person.id)
    setFollowingIds((prev) => new Set(prev).add(person.id))
    try {
      const { error } = await supabase.from("user_followers").insert({
        user_id: person.id,
        follower_id: authUser.id,
      })
      if (error) throw error
      void createNotification(supabase, {
        recipientId: person.id,
        actorId: authUser.id,
        type: "follow",
        entityType: "user",
        entityId: person.id,
      })
      setPeople((prev) => prev.filter((p) => p.id !== person.id))
    } catch (e) {
      console.error(e)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(person.id)
        return next
      })
      toast.error(t("home.whoToFollowError"))
    } finally {
      setBusyId(null)
    }
  }

  if (!authUser) return null

  return (
    <section className="rounded-2xl border border-border bg-muted/40 p-4">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">
        {t("home.whoToFollow")}
      </h2>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {t("common.loading")}
        </div>
      ) : people.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted-foreground">
          {t("home.whoToFollowEmpty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {people.map((person) => {
            const name = person.display_name?.trim() || person.username
            const busy = busyId === person.id || followingIds.has(person.id)
            return (
              <li key={person.id} className="flex items-center gap-2.5">
                <Link
                  href={`/${person.username}`}
                  className="shrink-0"
                >
                  <Avatar className="size-10 border border-border">
                    <AvatarImage
                      src={avatarDisplaySrc(person.avatar_url) ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                      {name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${person.username}`}
                    className="block truncate text-[13px] font-semibold text-foreground hover:underline"
                  >
                    {name}
                  </Link>
                  <p className="truncate text-[12px] text-muted-foreground">
                    @{person.username}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void follow(person)}
                  className={cn(
                    "shrink-0 rounded-full bg-foreground px-3 py-1 text-[12px] font-semibold text-background transition hover:opacity-90 disabled:opacity-60",
                  )}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    t("home.whoToFollowCta")
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
