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

function listsGridClassName(singleColumn: boolean, gridColumns: 2 | 3) {
  if (singleColumn) {
    return "mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-6"
  }
  if (gridColumns === 2) {
    return "mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8"
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
  const router = useRouter()
  const loggedInUser = useUser()
  const { lists, loading, error, fetchUserLists, deleteList } = useLists()
  const [editingList, setEditingList] = useState<List | null>(null)

  const targetUserId = userId || (loggedInUser?.id || "")
  const canEdit = loggedInUser?.id === targetUserId

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
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: gridColumns }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg border p-4">
            <div className="h-16 w-16 rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Could not load lists: {error}</p>
      </div>
    )
  }

  const displayLists = lists.slice(0, limit)

  if (alwaysShowThree) {
    const cappedLists = displayLists.slice(0, gridCols)

    return (
      <div className="">
        {!hideSectionHeading && (
          <div className="flex flex-col">
            <h2 className="text-start text-sm font-medium uppercase text-muted-foreground/80">Your lists</h2>
            <div className="mt-1 mb-4 h-px w-full bg-border" />
          </div>
        )}

        {cappedLists.length === 0 && !canEdit ? (
          <p className="text-sm text-muted-foreground">No lists yet.</p>
        ) : (
          <div className={listsGridClassName(singleColumn, gridColumns)}>
            {cappedLists.map((list) => (
              <div
                key={list.id}
                className={cn(
                  "group relative flex h-full min-h-0 flex-col",
                  compactCards
                    ? "overflow-visible rounded-xl"
                    : "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
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
                    "focus-visible:ring-2 focus-visible:ring-[#FF0048]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    listCardCompactMinHeightClassName,
                    createListTileGridClass(cappedLists.length, gridColumns),
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
                            "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-transparent",
                            "transition-colors group-hover:border-[#FF0048]/50 group-hover:bg-[#FF0048]/10",
                          )}
                        >
                          <Plus className="h-5 w-5 shrink-0 text-muted-foreground opacity-80 transition-colors group-hover:text-[#FF0048]" />
                        </div>
                      </div>
                    </div>
                    <h3 className="line-clamp-2 w-full px-1  text-sm font-normal leading-snug tracking-tight text-muted-foreground transition-colors group-hover:text-[#FF0048] sm:text-[0.95rem]">
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
                    "flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-transparent px-4 py-6 text-sm font-medium text-muted-foreground shadow-none transition-colors",
                    "hover:border-[#FF0048]/50 hover:bg-[#FF0048]/10 hover:text-[#FF0048]",
                    createListTileGridClass(cappedLists.length, gridColumns),
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
        <>
          <div className="mb-1 flex items-end justify-between">
            <h2 className="text-sm font-medium uppercase text-muted-foreground/80">Lists</h2>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/list/new")}
                className="flex aspect-square h-8 w-8 items-center justify-center gap-2 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mb-4 h-px w-full bg-border" />
        </>
      )}

      {displayLists.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <p>No lists found.</p>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => router.push("/list/new")} className="mt-2">
              Create your first list
            </Button>
          )}
        </div>
      ) : (
        <div className={listsGridClassName(singleColumn, gridColumns)}>
          {displayLists.map((list) => (
            <div
              key={list.id}
              className={cn(
                "group relative flex h-full min-h-0 flex-col",
                compactCards
                  ? "overflow-visible rounded-xl"
                  : "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
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
