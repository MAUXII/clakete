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

interface EditListDialogProps {
  list: List
  open: boolean
  onOpenChange: (open: boolean) => void
  onListUpdated: () => void
}

export function EditListDialog({ list, open, onOpenChange, onListUpdated }: EditListDialogProps) {
  const { updateList } = useLists()
  const { isShining } = useSubscription()
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Lista</DialogTitle>
          <DialogDescription>
            Edite as informações da sua lista de filmes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Meus Filmes Favoritos de 2024"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Descrição (opcional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Descreva sua lista..."
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public">Lista Pública</Label>
              <p className="text-sm text-muted-foreground">
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

          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="share-feed">Share to feed</Label>
                <p className="text-sm text-muted-foreground">
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
                      ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                      : "border-border/80 hover:border-border",
                  )}
                >
                  <Users className="size-4 text-[#FF0048]" />
                  <span className="text-xs font-medium">Friends</span>
                </button>
                <button
                  type="button"
                  disabled={!isPublic}
                  onClick={() => setFeedVisibility("public")}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                    !isPublic && "cursor-not-allowed opacity-40",
                    feedVisibility === "public"
                      ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                      : "border-border/80 hover:border-border",
                  )}
                >
                  <Globe2 className="size-4 text-[#FF0048]" />
                  <span className="text-xs font-medium">Public</span>
                </button>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
