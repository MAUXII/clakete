"use client"

import { useEffect, useState } from "react"
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"
import type { Database } from "@/lib/supabase/database.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useLists } from "@/hooks/use-lists"
import { useT } from "@/components/providers/i18n-provider"
import { toast } from "sonner"
import { Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useDesignMode } from "@/hooks/use-design-mode"
import { cn } from "@/lib/utils"

interface AddToListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movie: {
    id: number
    title: string
    poster_path?: string | null
    release_date?: string | null
  }
  mediaType?: "movie" | "tv"
}

export function AddToListDialog({
  open,
  onOpenChange,
  movie,
  mediaType = "movie",
}: AddToListDialogProps) {
  const user = useUser()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const supabase = useSupabaseClient<Database>()
  const { lists, fetchUserLists, addItemToList, removeItemFromList, loading: listsLoading } = useLists()
  const { t } = useT()

  const [includedListIds, setIncludedListIds] = useState<Set<string>>(new Set())
  const [loadingMemberships, setLoadingMemberships] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user?.id) return

    void fetchUserLists(user.id)

    async function loadMemberships() {
      setLoadingMemberships(true)
      try {
        const { data, error } = await supabase
          .from("list_items")
          .select("list_id")
          .eq("tmdb_id", movie.id)
          .eq("media_type", mediaType)

        if (error) throw error
        setIncludedListIds(new Set((data || []).map((row) => String(row.list_id))))
      } catch (err) {
        console.error("Erro ao verificar listas do filme:", err)
      } finally {
        setLoadingMemberships(false)
      }
    }

    void loadMemberships()
  }, [open, user?.id, movie.id, mediaType, fetchUserLists, supabase])

  const handleToggle = async (listId: string, listTitle: string) => {
    if (!user) {
      toast.error(t("auth.loginRequired") || "Faça login para gerenciar suas listas.")
      return
    }

    const isMember = includedListIds.has(listId)
    setTogglingId(listId)

    try {
      if (isMember) {
        const ok = await removeItemFromList(listId, movie.id, mediaType)
        if (ok) {
          setIncludedListIds((prev) => {
            const next = new Set(prev)
            next.delete(listId)
            return next
          })
          toast.success(`Removido de "${listTitle}"`)
        } else {
          toast.error("Erro ao remover da lista")
        }
      } else {
        const ok = await addItemToList(listId, {
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path ?? undefined,
          release_date: movie.release_date || undefined,
          position: 9999,
          media_type: mediaType,
        })
        if (ok) {
          setIncludedListIds((prev) => {
            const next = new Set(prev)
            next.add(listId)
            return next
          })
          toast.success(`Adicionado a "${listTitle}"`)
        } else {
          toast.error("Erro ao adicionar à lista")
        }
      }
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[85vh] overflow-hidden p-0 sm:max-w-md",
        isGlass
          ? "border-white/10 bg-[#161719]/96 text-white sm:rounded-[20px]"
          : "border-border bg-card text-foreground"
      )}>
        <DialogHeader className={cn(
          "border-b px-5 py-4 text-left",
          isGlass ? "border-white/10" : "border-border"
        )}>
          <DialogTitle className="text-base font-semibold">
            {t("film.addToList") || "Adicionar às listas"}
          </DialogTitle>
          <DialogDescription className={cn(
            "text-xs",
            isGlass ? "text-white/50" : "text-muted-foreground"
          )}>
            {movie.title}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          {loadingMemberships || listsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className={cn("h-5 w-5 animate-spin", isGlass ? "text-white/40" : "text-muted-foreground")} />
            </div>
          ) : !user ? (
            <div className={cn("py-8 text-center text-sm", isGlass ? "text-white/45" : "text-muted-foreground")}>
              {t("auth.loginRequired") || "Entre na sua conta para salvar em listas."}
            </div>
          ) : lists.length === 0 ? (
            <div className={cn("py-8 text-center text-sm", isGlass ? "text-white/45" : "text-muted-foreground")}>
              <p>Você ainda não criou nenhuma lista.</p>
              <Link
                href={`/${user.user_metadata?.username || "profile"}/lists`}
                onClick={() => onOpenChange(false)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar minha primeira lista
              </Link>
            </div>
          ) : (
            <div className={cn("flex flex-col divide-y", isGlass ? "divide-white/[0.08]" : "divide-border/50")}>
              {lists.map((list) => {
                const isChecked = includedListIds.has(list.id)
                const isToggling = togglingId === list.id

                return (
                  <label
                    key={list.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 px-3 py-3 rounded-lg transition",
                      isGlass ? "hover:bg-white/[0.05]" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", isGlass ? "text-white" : "text-foreground")}>
                        {list.title}
                      </p>
                      <p className={cn("text-[11px]", isGlass ? "text-white/40" : "text-muted-foreground")}>
                        {list.films_count || 0} {list.films_count === 1 ? "título" : "títulos"}
                        {list.is_public ? " · Pública" : " · Privada"}
                      </p>
                    </div>

                    {isToggling ? (
                      <Loader2 className={cn("h-4 w-4 animate-spin", isGlass ? "text-white/40" : "text-muted-foreground")} />
                    ) : (
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => void handleToggle(list.id, list.title)}
                      />
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
