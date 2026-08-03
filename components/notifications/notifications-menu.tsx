"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useUser } from "@supabase/auth-helpers-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNotifications, type AppNotification } from "@/hooks/use-notifications"
import { useT } from "@/components/providers/i18n-provider"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"
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

export function NotificationsMenu() {
  const { t } = useT()
  const user = useUser()
  const { items, unreadCount, loading, markAllRead, refresh } = useNotifications()

  if (!user) return null

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          void refresh()
          void markAllRead()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("notifications.title")}
          className={cn(
            "relative inline-flex size-9 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors",
            "hover:bg-muted/40 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25",
          )}
        >
          <Bell className="size-4" strokeWidth={1.75} aria-hidden />
          {unreadCount > 0 ? (
            <span
              className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-brand"
              aria-hidden
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
        <DropdownMenuLabel className="px-3 py-2.5 text-sm font-semibold">
          {t("notifications.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("notifications.empty")}
            </p>
          ) : (
            items.map((n) => {
              const href = notificationHref(n)
              const name = n.actor.display_name || n.actor.username
              return (
                <DropdownMenuItem key={n.id} asChild className="cursor-pointer p-0">
                  <Link
                    href={href}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5",
                      !n.readAt && "bg-brand/5",
                    )}
                  >
                    <Avatar className="mt-0.5 size-9 border border-border">
                      <AvatarImage
                        src={avatarDisplaySrc(n.actor.avatar_url) ?? undefined}
                        alt=""
                      />
                      <AvatarFallback className="bg-muted text-xs">
                        {name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-foreground">
                        {notificationCopy(n, t)}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatFeedRelativeTime(n.createdAt)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
