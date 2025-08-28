"use client"

import { useState } from "react"
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
import { CreateListData } from "@/types/list"

interface CreateListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onListCreated: () => void
}

export function CreateListDialog({ open, onOpenChange, onListCreated }: CreateListDialogProps) {
  const { createList } = useLists()
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      alert("Por favor, insira um título para a lista")
      return
    }

    setLoading(true)

    try {
      const listData: CreateListData = {
        title: title.trim(),
        bio: bio.trim() || undefined,
        is_public: isPublic
      }

      const newList = await createList(listData)
      
      if (newList) {
        // Limpar formulário
        setTitle("")
        setBio("")
        setIsPublic(true)
        
        // Fechar diálogo e notificar
        onOpenChange(false)
        onListCreated()
      } else {
        alert("Erro ao criar lista. Verifique se você está logado.")
      }
    } catch (error) {
      alert("Erro ao criar lista. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle("")
    setBio("")
    setIsPublic(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Lista</DialogTitle>
          <DialogDescription>
            Crie uma nova lista de filmes. Adicione um título e uma descrição opcional.
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Criando..." : "Criar Lista"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 