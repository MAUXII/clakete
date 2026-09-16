import type { Dispatch, SetStateAction } from "react"
import type { DragStartEvent } from "@dnd-kit/core"
import type { List, ListItem } from "@/types/list"

export type ListDetailGlassProps = {
  list: List
  listId: string
  films: ListItem[]
  setFilms: Dispatch<SetStateAction<ListItem[]>>
  canEdit: boolean
  currentUserId: string | null
  likeCount: number
  userLiked: boolean
  likePending: boolean
  watchedInList: number
  totalListItems: number
  progressPercent: number
  listTags: string[]
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  reorderMode: boolean
  reorderLeaving: boolean
  reorderSaving: boolean
  reorderShellExpanded: boolean
  reorderShellBorder: boolean
  listReorderDragBox: { w: number; h: number } | null
  onReorderDragStart: (e: DragStartEvent) => void
  onEnterReorder: () => void
  onCancelReorder: () => void
  onConfirmReorder: () => void
  onRemoveFilm: (film: ListItem) => void
  onOpenSearch: () => void
  onOpenEditList: () => void
  onOpenBannerEdit: () => void
  onToggleLike: () => void
}
