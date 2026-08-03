"use client"

import { useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Copy, Flag, MoreHorizontal, Ban } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useT } from "@/components/providers/i18n-provider"
import { cn } from "@/lib/utils"

type ProfileMoreMenuProps = {
  profileUserId: string
  username: string
  className?: string
  triggerClassName?: string
  onBlocked?: () => void
}

export function ProfileMoreMenu({
  profileUserId,
  username,
  className,
  triggerClassName,
  onBlocked,
}: ProfileMoreMenuProps) {
  const { t } = useT()
  const supabase = useSupabaseClient()
  const currentUser = useUser()
  const [busy, setBusy] = useState(false)

  const requireAuth = () => {
    if (currentUser?.id) return true
    toast.error(t("profile.loginToFollow"))
    return false
  }

  const copyProfileLink = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/${username}`
        : `/${username}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t("profile.linkCopied"))
    } catch {
      toast.error(t("common.errorGeneric"))
    }
  }

  const reportProfile = async () => {
    if (!requireAuth() || !currentUser) return
    setBusy(true)
    try {
      const { error } = await supabase.from("user_profile_reports").insert({
        reporter_id: currentUser.id,
        reported_user_id: profileUserId,
        reason: "other",
      })
      if (error) {
        if (error.code === "23505") {
          toast.message(t("profile.alreadyReported"))
          return
        }
        throw error
      }
      toast.success(t("profile.reportSubmitted"))
    } catch {
      toast.error(t("profile.reportError"))
    } finally {
      setBusy(false)
    }
  }

  const blockProfile = async () => {
    if (!requireAuth() || !currentUser) return
    if (
      typeof window !== "undefined" &&
      !window.confirm(t("profile.blockConfirm", { username }))
    ) {
      return
    }
    setBusy(true)
    try {
      const { error: blockError } = await supabase.from("user_blocks").insert({
        blocker_id: currentUser.id,
        blocked_id: profileUserId,
      })
      if (blockError) {
        if (blockError.code === "23505") {
          toast.message(t("profile.alreadyBlocked"))
          return
        }
        throw blockError
      }

      await Promise.all([
        supabase
          .from("user_followers")
          .delete()
          .eq("user_id", profileUserId)
          .eq("follower_id", currentUser.id),
        supabase
          .from("user_followers")
          .delete()
          .eq("user_id", currentUser.id)
          .eq("follower_id", profileUserId),
      ])

      toast.success(t("profile.blocked"))
      onBlocked?.()
    } catch {
      toast.error(t("profile.blockError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={busy}
          aria-label={t("profile.moreActions")}
          title={t("profile.moreActions")}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors",
            "hover:bg-muted/40 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
            "disabled:pointer-events-none disabled:opacity-50",
            triggerClassName,
          )}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-52", className)}>
        <DropdownMenuItem onClick={() => void copyProfileLink()}>
          <Copy className="mr-2 size-3.5" />
          {t("profile.copyProfileLink")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onClick={() => void reportProfile()}
        >
          <Flag className="mr-2 size-3.5" />
          {t("profile.reportUser")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy}
          className="text-red-400 focus:text-red-300"
          onClick={() => void blockProfile()}
        >
          <Ban className="mr-2 size-3.5" />
          {t("profile.blockUser")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
