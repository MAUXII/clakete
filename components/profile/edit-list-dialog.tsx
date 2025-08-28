"use client"

import { useState, useEffect } from "react"
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
import { List, UpdateListData } from "@/types/list"

interface EditListDialogProps {
  list: List
  open: boolean
  onOpenChange: (open: boolean) => void
  onListUpdated: () => void
}

export function EditListDialog({ list, open, onOpenChange, onListUpdated }: EditListDialogProps) {
  const { updateList } = useLists()
  const [title, setTitle] = useState(list.title)
  const [bio, setBio] = useState(list.bio || "")
  const [isPublic, setIsPublic] = useState(list.is_public)
  const [loading, setLoading] = useState(false)

  // Atualizar estado quando a lista muda
  useEffect(() => {
    if (open) {
      setTitle(list.title)
      setBio(list.bio || "")
      setIsPublic(list.is_public)
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
        is_public: isPublic
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
                Outros usuários podem ver listas públicas
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
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