"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

export type FollowListUser = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function UserFollowersList({
  userId,
  mode,
  username,
}: {
  userId: string
  mode: "followers" | "following"
  username: string
}) {
  const supabase = useSupabaseClient()
  const authUser = useUser()
  const [users, setUsers] = useState<FollowListUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)

  const title = mode === "followers" ? "Followers" : "Following"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let ids: string[] = []

      if (mode === "followers") {
        const { data, error } = await supabase
          .from("user_followers")
          .select("follower_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        if (error) throw error
        ids = (data ?? []).map((r) => r.follower_id as string)
      } else {
        const { data, error } = await supabase
          .from("user_followers")
          .select("user_id, created_at")
          .eq("follower_id", userId)
          .order("created_at", { ascending: false })
        if (error) throw error
        ids = (data ?? []).map((r) => r.user_id as string)
      }

      if (ids.length === 0) {
        setUsers([])
        return
      }

      const { data: profiles, error: usersError } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url")
        .in("id", ids)

      if (usersError) throw usersError

      const byId = new Map((profiles ?? []).map((u) => [u.id as string, u]))
      const ordered: FollowListUser[] = []
      for (const id of ids) {
        const u = byId.get(id)
        if (!u?.username) continue
        ordered.push({
          id: u.id as string,
          username: u.username as string,
          display_name: (u.display_name as string | null) ?? null,
          avatar_url: (u.avatar_url as string | null) ?? null,
        })
      }
      setUsers(ordered)

      if (authUser?.id) {
        const { data: mine } = await supabase
          .from("user_followers")
          .select("user_id")
          .eq("follower_id", authUser.id)
          .in("user_id", ids)
        setFollowingIds(new Set((mine ?? []).map((r) => r.user_id as string)))
      }
    } catch (e) {
      console.error("[follow-list]", e)
      toast.error(`Could not load ${title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }, [authUser?.id, mode, supabase, title, userId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "")
    if (!q) return users
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.display_name?.toLowerCase().includes(q) ?? false),
    )
  }, [users, query])

  const toggleFollow = async (targetId: string) => {
    if (!authUser?.id) {
      toast.error("Sign in to follow people")
      return
    }
    if (targetId === authUser.id) return

    setBusyId(targetId)
    const isFollowing = followingIds.has(targetId)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_followers")
          .delete()
          .eq("user_id", targetId)
          .eq("follower_id", authUser.id)
        if (error) throw error
        setFollowingIds((prev) => {
          const next = new Set(prev)
          next.delete(targetId)
          return next
        })
      } else {
        const { error } = await supabase.from("user_followers").insert({
          user_id: targetId,
          follower_id: authUser.id,
          created_at: new Date().toISOString(),
        })
        if (error) throw error
        setFollowingIds((prev) => new Set(prev).add(targetId))
      }
    } catch (e) {
      console.error(e)
      toast.error("Could not update follow")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground/50">
            {title}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            @{username} · {users.length}{" "}
            {users.length === 1 ? "person" : "people"}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-8 border-white/[0.08] bg-transparent pl-8 text-xs"
          />
        </div>
      </div>
      <div className="mb-4 mt-2 h-[0.3px] w-full bg-muted-foreground/10" />

      {loading ? (
        <ul className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md bg-white/[0.04]" />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">
          {users.length === 0
            ? mode === "followers"
              ? "No followers yet"
              : "Not following anyone yet"
            : "No matches"}
        </p>
      ) : (
        <ul className="space-y-1">
          {filtered.map((u) => {
            const isMe = authUser?.id === u.id
            const isFollowing = followingIds.has(u.id)
            return (
              <li
                key={u.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/[0.03]"
              >
                <Link href={`/${u.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="size-10 rounded-md border border-white/[0.08]">
                    <AvatarImage
                      src={avatarDisplaySrc(u.avatar_url) ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className="rounded-md text-sm">
                      {(u.display_name?.[0] || u.username[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {u.display_name || u.username}
                    </p>
                    <p className="truncate text-xs text-zinc-500">@{u.username}</p>
                  </div>
                </Link>

                {!isMe && authUser ? (
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => void toggleFollow(u.id)}
                    className={cn(
                      "h-8 shrink-0 rounded-md border px-3 text-xs font-medium transition",
                      isFollowing
                        ? "border-white/[0.1] text-zinc-400 hover:border-red-500/40 hover:text-red-400"
                        : "border-[#FF0048]/20 bg-[#FF0048]/10 text-[#FF0048] hover:bg-[#FF0048]/20",
                    )}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
