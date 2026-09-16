"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@supabase/auth-helpers-react"
import { List } from "@/types/list"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, MoreVertical } from "lucide-react"
import { useLists } from "@/hooks/use-lists"
import { EditListDialog } from "./edit-list-dialog"
import { UserListCard } from "../lists/user-list-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  listCardCompactMinHeightClassName,
  listCardMinHeightClassName,
} from "@/components/lists/list-card-shell"
import { ListPosterStack } from "@/components/lists/list-poster-stack"
import { cn } from "@/lib/utils"
import { useT } from "@/components/providers/i18n-provider"
import { ProfileSectionHeader } from "@/components/profile/profile-section-header"
import { useDesignMode } from "@/hooks/use-design-mode"

/** Mesmos 5 slots vazios que um `UserListCard` compact usa para dimensionar o stack. */
const EMPTY_COMPACT_STACK: (string | null)[] = [null, null, null, null, null]

interface UserListsProps {
  userId?: string
  limit?: number
  onLandingPage?: boolean
  alwaysShowThree?: boolean
  gridCols?: number
  gridColumns?: 2 | 3
  hideSectionHeading?: boolean
  refreshKey?: number
  singleColumn?: boolean
  compactCards?: boolean
}

function listsGridClassName(singleColumn: boolean, gridColumns: 2 | 3, isGlass: boolean) {
  if (singleColumn) {
    return "mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-6"
  }
  if (isGlass || gridColumns === 2) {
    return cn(
      "mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch sm:grid-cols-2",
      isGlass ? "gap-5 sm:gap-6" : "gap-6 sm:gap-8",
    )
  }
  return "mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8"
}

/** Colunas extra no tile «Create» para alinhar à grelha; em 3 colunas o tile deve ocupar só 1 célula (como um `ListCard`). */
function createListTileGridClass(listCount: number, gridColumns: 2 | 3) {
  if (gridColumns === 2) {
    if (listCount === 0) return "col-span-full sm:col-span-2"
    if (listCount >= 2) return "sm:col-span-2"
    return ""
  }
  return ""
}

export function UserLists({
  userId,
  limit = 6,
  onLandingPage,
  alwaysShowThree = false,
  gridCols = 2,
  gridColumns = 2,
  hideSectionHeading = false,
  refreshKey = 0,
  singleColumn = false,
  compactCards = true,
}: UserListsProps) {
  const { t } = useT()
  const router = useRouter()
  const isGlass = useDesignMode() === "glass"
  const loggedInUser = useUser()
  const { lists, loading, error, fetchUserLists, deleteList } = useLists()
  const [editingList, setEditingList] = useState<List | null>(null)

  const targetUserId = userId || (loggedInUser?.id || "")
  const canEdit = loggedInUser?.id === targetUserId
  const effectiveGridColumns: 2 | 3 = isGlass ? 2 : gridColumns
  const gridClass = listsGridClassName(singleColumn, effectiveGridColumns, isGlass)

  useEffect(() => {
    if (targetUserId) {
      fetchUserLists(targetUserId)
    }
  }, [targetUserId, fetchUserLists, refreshKey])

  const handleDeleteList = async (listId: string) => {
    if (confirm("Delete this list? This cannot be undone.")) {
      await deleteList(listId)
    }
  }

  if (loading) {
    const listsTitle = alwaysShowThree ? "Your lists" : "Lists"
    return (
      <div className="">
        {!hideSectionHeading && (
          <div className="flex flex-col">
            <h2
              className={cn(
                "text-sm font-medium uppercase",
                alwaysShowThree
                  ? "text-start text-muted-foreground/80"
                  : "text-muted-foreground/80",
              )}
            >
              {listsTitle}
            </h2>
            <div className="mt-1 mb-4 h-px w-full bg-border" />
          </div>
        )}
        <div className={gridClass}>
          {Array.from({ length: alwaysShowThree ? (isGlass ? 2 : gridCols) : Math.min(effectiveGridColumns * 2, 6) }).map(
            (_, i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse overflow-hidden",
                  isGlass
                    ? "rounded-[18px] bg-white/[0.035] ring-1 ring-white/[0.08]"
                    : cn(
                        "rounded-2xl border border-border bg-card",
                        compactCards ? "rounded-xl" : null,
                        compactCards ? listCardCompactMinHeightClassName : listCardMinHeightClassName,
                      ),
                )}
              >
                <div className="flex h-full flex-col gap-3 p-4">
                  <div className={cn("aspect-[16/9] w-full rounded-lg", isGlass ? "bg-white/[0.06]" : "bg-muted")} />
                  <div className={cn("h-4 w-3/4 rounded", isGlass ? "bg-white/[0.08]" : "bg-muted")} />
                  <div className={cn("h-3 w-1/2 rounded", isGlass ? "bg-white/[0.05]" : "bg-muted")} />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        <p>{t("profile.loadListsError")}{error ? `: ${error}` : ""}</p>
      </div>
    )
  }

  const displayLists = lists.slice(0, limit)

  if (alwaysShowThree) {
    const cappedLists = displayLists.slice(0, isGlass ? Math.min(gridCols, 2) : gridCols)

    return (
      <div className="">
        {!hideSectionHeading && (
          <ProfileSectionHeader
            title={t("profile.lists")}
            glassMode={alwaysShowThree || onLandingPage ? "soft" : "hide"}
          />
        )}

        {cappedLists.length === 0 && !canEdit ? (
          <p className="text-sm text-muted-foreground">{t("profile.listsEmpty")}</p>
        ) : (
          <div className={gridClass}>
            {cappedLists.map((list) => (
              <div
                key={list.id}
                className={cn(
                  "group relative flex h-full min-h-0 flex-col",
                  isGlass
                    ? "overflow-visible"
                    : compactCards
                      ? "overflow-visible rounded-xl"
                      : "overflow-hidden rounded-2xl border border-border bg-card",
                )}
              >
                {canEdit && (
                  <div
                    className={cn(
                      "absolute z-10 opacity-0 transition-opacity group-hover:opacity-100",
                      compactCards ? "right-1 top-1" : "right-3 top-3",
                    )}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 bg-background/90 p-0 shadow-sm backdrop-blur-sm hover:bg-background"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleDeleteList(list.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete list
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <UserListCard list={list} compact={compactCards} />
              </div>
            ))}
            {canEdit &&
              (compactCards ? (
                <button
                  type="button"
                  onClick={() => router.push("/list/new")}
                  aria-label="Create new list"
                  className={cn(
                    "group relative flex w-full min-w-0 flex-col items-center rounded-xl pb-2 pt-1 text-left outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    listCardCompactMinHeightClassName,
                    createListTileGridClass(cappedLists.length, effectiveGridColumns),
                  )}
                >
                  <div className="relative z-[2] flex w-full flex-col items-center gap-1.5">
                    <div className="w-full min-w-0 pt-0.5">
                      <div className="relative w-full">
                        <div className="invisible w-full" aria-hidden>
                          <ListPosterStack posters={EMPTY_COMPACT_STACK} compact />
                        </div>
                        <div
                          className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-transparent",
                            isGlass
                              ? "border-white/20 group-hover:border-white/40 group-hover:bg-white/[0.04]"
                              : "border-muted-foreground/30 group-hover:border-brand/50 group-hover:bg-brand/10",
                          )}
                        >
                          <Plus
                            className={cn(
                              "h-5 w-5 shrink-0 opacity-80 transition-colors",
                              isGlass
                                ? "text-white/50 group-hover:text-white/80"
                                : "text-muted-foreground group-hover:text-brand",
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <h3 className="line-clamp-2 w-full px-1  text-sm font-normal leading-snug tracking-tight text-muted-foreground transition-colors group-hover:text-brand sm:text-[0.95rem]">
                      Create new list
                    </h3>
                  </div>
                </button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    listCardMinHeightClassName,
                    "flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-2 border-2 border-dashed bg-transparent px-4 py-6 text-sm font-medium shadow-none transition-colors",
                    isGlass
                      ? "rounded-[18px] border-white/20 text-white/50 hover:border-white/40 hover:bg-white/[0.04] hover:text-white/80"
                      : "rounded-2xl border-muted-foreground/30 text-muted-foreground hover:border-brand/50 hover:bg-brand/10 hover:text-brand",
                    createListTileGridClass(cappedLists.length, effectiveGridColumns),
                  )}
                  onClick={() => router.push("/list/new")}
                >
                  <Plus className="h-5 w-5 shrink-0 opacity-80" />
                  Create new list
                </Button>
              ))}
          </div>
        )}

        {editingList && (
          <EditListDialog
            list={editingList}
            open={!!editingList}
            onOpenChange={(open) => {
              if (!open) {
                setEditingList(null)
              }
            }}
            onListUpdated={() => {
              setEditingList(null)
              fetchUserLists(targetUserId)
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="">
      {!hideSectionHeading && (
        <ProfileSectionHeader
          title={t("profileTabs.lists")}
          glassMode={alwaysShowThree || onLandingPage ? "soft" : "hide"}
          trailing={
            canEdit ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/list/new")}
                className="flex aspect-square h-8 w-8 items-center justify-center gap-2 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : null
          }
        />
      )}

      {displayLists.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>{t("profile.listsNotFound")}</p>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => router.push("/list/new")} className="mt-2">
              Create your first list
            </Button>
          )}
        </div>
      ) : (
        <div className={gridClass}>
          {displayLists.map((list) => (
            <div
              key={list.id}
              className={cn(
                "group relative flex h-full min-h-0 flex-col",
                isGlass
                  ? "overflow-visible"
                  : compactCards
                    ? "overflow-visible rounded-xl"
                    : "overflow-hidden rounded-2xl border border-border bg-card",
              )}
            >
              {canEdit && (
                <div
                  className={cn(
                    "absolute z-10 opacity-0 transition-opacity group-hover:opacity-100",
                    compactCards ? "right-1 top-1" : "right-3 top-3",
                  )}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 bg-background/90 p-0 shadow-sm backdrop-blur-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => handleDeleteList(list.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete list
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <UserListCard list={list} compact={compactCards} />
            </div>
          ))}
        </div>
      )}

      {editingList && (
        <EditListDialog
          list={editingList}
          open={!!editingList}
          onOpenChange={(open) => {
            if (!open) {
              setEditingList(null)
            }
          }}
          onListUpdated={() => {
            setEditingList(null)
            fetchUserLists(targetUserId)
          }}
        />
      )}
    </div>
  )
}
