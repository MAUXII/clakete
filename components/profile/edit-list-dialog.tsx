"use client"

import { useState, useEffect } from "react"
import { Globe2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useLists } from "@/hooks/use-lists"
import { useSubscription } from "@/hooks/use-subscription"
import { List, UpdateListData } from "@/types/list"
import { FREE_PRIVATE_LIST_LIMIT } from "@/lib/plans"
import { cn } from "@/lib/utils"
import { useDesignMode } from "@/hooks/use-design-mode"

interface EditListDialogProps {
  list: List
  open: boolean
  onOpenChange: (open: boolean) => void
  onListUpdated: () => void
}

export function EditListDialog({ list, open, onOpenChange, onListUpdated }: EditListDialogProps) {
  const { updateList } = useLists()
  const { isShining } = useSubscription()
  const designMode = useDesignMode()
  const isGlass = designMode === "glass"
  const [title, setTitle] = useState(list.title)
  const [bio, setBio] = useState(list.bio || "")
  const [isPublic, setIsPublic] = useState(list.is_public)
  const [shareToFeed, setShareToFeed] = useState(Boolean(list.feed_shared))
  const [feedVisibility, setFeedVisibility] = useState<"friends" | "public">(
    list.feed_visibility === "public" ? "public" : "friends",
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(list.title)
      setBio(list.bio || "")
      setIsPublic(list.is_public)
      setShareToFeed(Boolean(list.feed_shared))
      setFeedVisibility(list.feed_visibility === "public" ? "public" : "friends")
    }
  }, [list, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert("Por favor, insira um título para a lista")
      return
    }

    setLoading(true)

    try {
      const updateData: UpdateListData = {
        title: title.trim(),
        bio: bio.trim() || undefined,
        is_public: isPublic,
        feed_shared: shareToFeed,
        feed_visibility:
          !isPublic || feedVisibility === "friends" ? "friends" : "public",
      }

      const success = await updateList(list.id, updateData)

      if (success) {
        onOpenChange(false)
        onListUpdated()
      }
    } catch (error) {
      console.error("Erro ao atualizar lista:", error)
      alert("Erro ao atualizar lista. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[425px]", isGlass && "border-white/10 bg-[#161719]/96 text-white sm:rounded-[20px] backdrop-blur-2xl shadow-[0_28px_64px_-16px_rgba(0,0,0,0.9)]")}>
        <DialogHeader>
          <DialogTitle className={cn(isGlass && "text-white font-semibold")}>Editar Lista</DialogTitle>
          <DialogDescription className={cn(isGlass && "text-white/50")}>
            Edite as informações da sua lista de filmes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className={cn(isGlass && "text-white/70")}>Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meus Filmes Favoritos de 2024"
              maxLength={100}
              required
              className={cn(isGlass && "rounded-xl border-white/10 bg-white/[0.04] text-white")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className={cn(isGlass && "text-white/70")}>Descrição (opcional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva sua lista..."
              maxLength={500}
              rows={3}
              className={cn(isGlass && "rounded-xl border-white/10 bg-white/[0.04] text-white resize-none")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public" className={cn(isGlass && "text-white/80")}>Lista Pública</Label>
              <p className={cn("text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
                Outros usuários podem ver listas públicas.
                {!isPublic
                  ? isShining
                    ? " The Shining: unlimited private lists."
                    : ` Free: up to ${FREE_PRIVATE_LIST_LIMIT} private lists.`
                  : null}
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={(v) => {
                setIsPublic(v)
                if (!v) setFeedVisibility("friends")
              }}
            />
          </div>

          <div className={cn("space-y-3 rounded-xl border p-3", isGlass ? "border-white/10 bg-white/[0.03]" : "border-border/80 bg-muted/20")}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="share-feed" className={cn(isGlass && "text-white/80")}>Share to feed</Label>
                <p className={cn("text-sm", isGlass ? "text-white/40" : "text-muted-foreground")}>
                  Mostrar esta lista no feed dos seus follows
                </p>
              </div>
              <Switch
                id="share-feed"
                checked={shareToFeed}
                onCheckedChange={setShareToFeed}
              />
            </div>

            {shareToFeed ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedVisibility("friends")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                    feedVisibility === "friends"
                      ? "border-brand/40 bg-brand/10"
                      : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                  )}
                >
                  <Users className="size-4 text-brand" />
                  <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Friends</span>
                </button>
                <button
                  type="button"
                  disabled={!isPublic}
                  onClick={() => setFeedVisibility("public")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                    !isPublic && "cursor-not-allowed opacity-40",
                    feedVisibility === "public"
                      ? "border-brand/40 bg-brand/10"
                      : isGlass ? "border-white/10 hover:border-white/20" : "border-border/80 hover:border-border",
                  )}
                >
                  <Globe2 className="size-4 text-brand" />
                  <span className={cn("text-xs font-medium", isGlass ? "text-white" : "text-foreground")}>Public</span>
                </button>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cn(isGlass && "rounded-xl border-white/12 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className={cn(isGlass ? "rounded-xl bg-white px-5 font-semibold text-black hover:bg-white/90" : "bg-brand hover:bg-brand-hover")}
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
