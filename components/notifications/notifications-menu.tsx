"use client"

import Link from "next/link"
import { useUser } from "@supabase/auth-helpers-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications, type AppNotification } from "@/hooks/use-notifications"
import { useT } from "@/components/providers/i18n-provider"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"
import { formatFeedRelativeTime } from "@/hooks/use-following-feed"

function notificationHref(n: AppNotification): string {
  if (n.type === "follow") return `/${n.actor.username}`
  if (n.entityType === "interaction" && n.entityId) {
    return `/?post=${n.entityId}`
  }
  return `/${n.actor.username}`
}

function notificationCopy(
  n: AppNotification,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const name = n.actor.display_name || n.actor.username
  switch (n.type) {
    case "follow":
      return t("notifications.followedYou", { name })
    case "feed_like":
      return t("notifications.likedPost", { name })
    case "feed_comment":
      return t("notifications.commentedPost", { name })
    case "review_like":
      return t("notifications.likedReview", { name })
    default:
      return t("notifications.generic", { name })
  }
}

export function NotificationsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useT()
  const user = useUser()
  const { items, loading, markAllRead, refresh } = useNotifications()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"

  if (!user) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) {
          void refresh()
          void markAllRead()
        }
      }}
    >
      <DialogContent className={cn(
        "max-h-[min(85dvh,32rem)] gap-0 overflow-hidden p-0 sm:max-w-md",
        isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[24px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]"
      )}>
        <DialogHeader className={cn("border-b px-4 py-3.5 text-left", isGlass ? "border-white/10" : "border-border")}>
          <DialogTitle className={cn("text-base font-semibold", isGlass && "text-white")}>
            {t("notifications.title")}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(70dvh,26rem)] overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className={cn("px-4 py-8 text-center text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
              {t("common.loading")}
            </p>
          ) : items.length === 0 ? (
            <p className={cn("px-4 py-8 text-center text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
              {t("notifications.empty")}
            </p>
          ) : (
            items.map((n) => {
              const href = notificationHref(n)
              const name = n.actor.display_name || n.actor.username
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0",
                    isGlass
                      ? "border-white/[0.08] hover:bg-white/[0.04]"
                      : "border-border/60 hover:bg-muted/40",
                    !n.readAt && (isGlass ? "bg-white/[0.03]" : "bg-brand/5"),
                  )}
                >
                  <Avatar className={cn("mt-0.5 size-9 border", isGlass ? "border-white/10" : "border-border")}>
                    <AvatarImage
                      src={avatarDisplaySrc(n.actor.avatar_url) ?? undefined}
                      alt=""
                    />
                    <AvatarFallback className={cn("text-xs", isGlass ? "bg-white/10 text-white" : "bg-muted")}>
                      {name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-snug", isGlass ? "text-white/90" : "text-foreground")}>
                      {notificationCopy(n, t)}
                    </span>
                    <span className={cn("mt-0.5 block text-[11px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
                      {formatFeedRelativeTime(n.createdAt)}
                    </span>
                  </span>
                </Link>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
