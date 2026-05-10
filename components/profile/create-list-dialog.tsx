"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Loader2, X } from "lucide-react"
import { useUser } from "@supabase/auth-helpers-react"
import { toast } from "sonner"

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
import { Command } from "@/components/ui/command"
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content"
import { useDebounce } from "@/hooks/use-debounce"
import { useMediaSearch, type SeriesSearchResult } from "@/hooks/use-media-search"
import { useLists } from "@/hooks/use-lists"
import type { CreateListData, ListMediaType } from "@/types/list"
import { cn } from "@/lib/utils"

const MIN_REQUIRED_TITLES = 5
const CLAKETE = "#FF0048"

interface CreateListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onListCreated: () => void
}

type StagedItem = {
  tmdb_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  media_type: ListMediaType
}

type CreateListStep = 1 | 2 | 3

function stageKey(item: StagedItem) {
  return `${item.media_type}-${item.tmdb_id}`
}

function normalizeTag(raw: string) {
  return raw.trim().replace(/\s+/g, " ").slice(0, 30)
}

export function CreateListDialog({ open, onOpenChange, onListCreated }: CreateListDialogProps) {
  const user = useUser()
  const { createList, addItemToList } = useLists()

  const [step, setStep] = useState<CreateListStep>(1)
  const [title, setTitle] = useState("")
  const [bio, setBio] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [sidebarQuery, setSidebarQuery] = useState("")
  const debouncedSidebar = useDebounce(sidebarQuery, 320)
  const searchEnabled = open && step === 3
  const { filmResults, seriesResults, loading: searchLoading } = useMediaSearch(debouncedSidebar, searchEnabled)
  const [staged, setStaged] = useState<StagedItem[]>([])

  const resetForm = useCallback(() => {
    setStep(1)
    setTitle("")
    setBio("")
    setIsPublic(true)
    setTags([])
    setTagInput("")
    setSidebarQuery("")
    setStaged([])
  }, [])

  useEffect(() => {
    if (open) resetForm()
  }, [open, resetForm])

  const addToStaged = useCallback((item: StagedItem) => {
    setStaged((prev) => {
      if (prev.some((p) => stageKey(p) === stageKey(item))) return prev
      return [...prev, item]
    })
  }, [])

  const removeStaged = useCallback((item: StagedItem) => {
    setStaged((prev) => prev.filter((p) => stageKey(p) !== stageKey(item)))
  }, [])

  const commitTag = useCallback(() => {
    const clean = normalizeTag(tagInput)
    if (!clean) return
    setTags((prev) => {
      if (prev.some((t) => t.toLowerCase() === clean.toLowerCase())) return prev
      return [...prev, clean]
    })
    setTagInput("")
  }, [tagInput])

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }, [])

  const canGoNextFromStep1 = useMemo(() => title.trim().length > 0, [title])
  const canSubmit = useMemo(
    () => title.trim().length > 0 && staged.length >= MIN_REQUIRED_TITLES && !loading,
    [title, staged.length, loading],
  )

  const handleNext = () => {
    if (step === 1) {
      if (!canGoNextFromStep1) {
        toast.error("Insira um título para continuar.")
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      commitTag()
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step === 1) return
    setStep((prev) => (prev === 3 ? 2 : 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step !== 3) {
      handleNext()
      return
    }
    if (!title.trim()) {
      toast.error("Insira um título para a lista.")
      return
    }
    if (staged.length < MIN_REQUIRED_TITLES) {
      toast.error(`Adicione pelo menos ${MIN_REQUIRED_TITLES} títulos para criar a lista.`)
      return
    }
    if (!user) {
      toast.error("Faça login para criar uma lista.")
      return
    }

    setLoading(true)
    try {
      const listData: CreateListData = {
        title: title.trim(),
        bio: bio.trim() || undefined,
        is_public: isPublic,
        tags: tags.length ? tags : undefined,
      }

      const newList = await createList(listData)
      if (!newList) {
        toast.error("Não foi possível criar a lista.")
        return
      }

      let failed = 0
      for (let i = 0; i < staged.length; i++) {
        const s = staged[i]
        const ok = await addItemToList(newList.id, {
          tmdb_id: s.tmdb_id,
          title: s.title,
          poster_path: s.poster_path ?? undefined,
          release_date: s.release_date ?? undefined,
          position: i + 1,
          media_type: s.media_type,
        })
        if (!ok) failed += 1
      }

      if (failed > 0) {
        toast.error(`Lista criada, mas ${failed} título(s) não foram adicionados.`)
      }

      resetForm()
      onOpenChange(false)
      onListCreated()
    } catch {
      toast.error("Erro ao criar lista. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex w-full max-w-[min(96vw,50rem)] flex-col gap-0 overflow-hidden p-0",
          "max-h-[92dvh] sm:max-h-[min(84vh,700px)]",
          "border-zinc-200 bg-background sm:rounded-2xl dark:border-zinc-800",
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Criar nova lista</DialogTitle>
          <DialogDescription>Crie sua lista em etapas.</DialogDescription>
        </DialogHeader>

        <div
          className="relative shrink-0 overflow-hidden border-b border-zinc-800/80 px-6 py-3.5"
          style={{
            background: `linear-gradient(120deg, #09090b 0%, #18181b 45%, color-mix(in srgb, ${CLAKETE} 22%, #09090b) 100%)`,
          }}
        >
          <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[#FF0048]/20 blur-3xl" />
          <div className="relative min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-white">Nova lista</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Etapa {step} de 3</p>
          </div>
        </div>

        <div className="border-b border-border px-6 py-3">
          <div className="ml-auto flex w-40 items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  step >= n ? "bg-[#FF0048]" : "bg-zinc-700/40",
                )}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {step === 1 ? (
              <div className="mx-auto w-full max-w-[38rem] space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-list-title" className="text-foreground">
                    Título <span className="text-zinc-400">*</span>
                  </Label>
                  <Input
                    id="create-list-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex.: Noites de chuva, filmes quentes"
                    maxLength={100}
                    className="rounded-xl border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-list-bio">Descrição</Label>
                  <Textarea
                    id="create-list-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Opcional — o que une esses títulos?"
                    maxLength={500}
                    rows={4}
                    className="resize-none rounded-xl border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50"
                  />
                </div>

                <fieldset className="space-y-1.5 px-0.5">
                  <legend className="px-1 pb-1 text-sm font-medium text-foreground">Privacidade</legend>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
                    <input
                      type="radio"
                      name="list-privacy"
                      value="public"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="mt-1 h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Pública</span>
                      <span className="block text-xs text-muted-foreground">Visível para todos no Clakete.</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
                    <input
                      type="radio"
                      name="list-privacy"
                      value="private"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="mt-1 h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Privada</span>
                      <span className="block text-xs text-muted-foreground">Só você pode acessar.</span>
                    </span>
                  </label>
                </fieldset>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mx-auto w-full max-w-[38rem] space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-list-tags">Tags</Label>
                  <p className="text-sm text-muted-foreground">
                    Adicione tags para organizar melhor a lista.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="create-list-tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Ex.: drama, sci-fi, comfort-watch"
                      maxLength={30}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault()
                          commitTag()
                        }
                      }}
                      className="rounded-xl border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/50"
                    />
                    <Button type="button" variant="outline" className="rounded-xl" onClick={commitTag}>
                      Adicionar
                    </Button>
                  </div>
                </div>

                <div className="min-h-20 rounded-xl border border-zinc-200/80 bg-transparent p-3 dark:border-zinc-800/80">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma tag adicionada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                        >
                          <span>{tag}</span>
                          <X className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
                <div className="min-h-0 rounded-xl border border-zinc-200/70 bg-transparent p-3 dark:border-zinc-800/70">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Títulos selecionados</p>
                    <p className="text-xs text-muted-foreground">
                      {staged.length} selecionado(s) · mínimo {MIN_REQUIRED_TITLES}
                    </p>
                  </div>
                  <div className="custom-scrollbar flex max-h-[240px] min-h-[84px] flex-wrap gap-2 overflow-y-auto">
                    {staged.length === 0 ? (
                      <p className="w-full py-2 text-sm text-muted-foreground">Nenhum título adicionado ainda.</p>
                    ) : (
                      staged.map((s) => (
                        <div
                          key={stageKey(s)}
                          className="group relative h-[88px] w-[58px] shrink-0 overflow-hidden rounded-md border border-border bg-zinc-900 shadow-sm"
                        >
                          {s.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                              alt={s.title}
                              width={116}
                              height={176}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-400">
                              {s.title.slice(0, 24)}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeStaged(s)}
                            className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                            aria-label={`Remover ${s.title}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <aside className="min-h-[340px] overflow-hidden rounded-xl border border-zinc-200/70 bg-transparent dark:border-zinc-800/70">
                  <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-foreground">Buscar filmes e séries</p>
                    <p className="text-xs text-muted-foreground">Adicione pelo menos {MIN_REQUIRED_TITLES} itens.</p>
                  </div>
                  <Command shouldFilter={false} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent">
                    <MediaSearchCommandContent
                      query={sidebarQuery}
                      onQueryChange={setSidebarQuery}
                      filmResults={filmResults}
                      seriesResults={seriesResults}
                      loading={searchLoading}
                      suppressDialogTitle
                      inputPlaceholder="Search for movies and series"
                      commandInputClassName="mx-2 my-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2"
                      commandListClassName="custom-scrollbar max-h-[min(48vh,360px)] px-0 py-2"
                      filmRowMode="pick"
                      seriesRowMode="pick"
                      onSelectFilm={(movie) => {
                        addToStaged({
                          tmdb_id: movie.id,
                          title: movie.title || "Sem título",
                          poster_path: movie.poster_path ?? null,
                          release_date: movie.release_date ?? null,
                          media_type: "movie",
                        })
                      }}
                      onSelectSeries={(series: SeriesSearchResult) => {
                        addToStaged({
                          tmdb_id: series.id,
                          title: series.name || "Sem título",
                          poster_path: series.poster_path ?? null,
                          release_date: series.first_air_date ?? null,
                          media_type: "tv",
                        })
                      }}
                    />
                  </Command>
                </aside>
              </div>
            ) : null}
          </div>

          <DialogFooter className="flex shrink-0 flex-col gap-2 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {step === 1 ? "Dados básicos da lista." : null}
              {step === 2 ? "Tags são opcionais, mas ajudam na organização." : null}
              {step === 3 ? `Você precisa de no mínimo ${MIN_REQUIRED_TITLES} títulos.` : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} className="rounded-xl">
                Cancelar
              </Button>
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading} className="rounded-xl">
                  Voltar
                </Button>
              ) : null}
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || (step === 1 && !canGoNextFromStep1)}
                  className="rounded-xl"
                  variant="outline"
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-xl bg-[#FF0048] text-white hover:bg-[#e60042]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando…
                    </>
                  ) : (
                    "Criar lista"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
