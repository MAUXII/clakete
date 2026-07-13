"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, GalleryHorizontal, LayoutGrid, Loader2 } from "lucide-react"
import ReactMasonryCss from "react-masonry-css"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDisplaySrc } from "@/lib/next-remote-image"
import { cn } from "@/lib/utils"

export type FeedImageKind = "poster" | "backdrop"

export type FeedImageChoice = {
  filePath: string
  kind: FeedImageKind
}

export type FeedImageLayout = "slide" | "collage"

export type FeedPostPayload = {
  images: FeedImageChoice[]
  title: string
  caption: string
  layout: FeedImageLayout
}

type GalleryItem = FeedImageChoice & {
  url: string
}

const MAX_IMAGES = 6
const TITLE_MAX = 80
const CAPTION_MAX = 500

interface FeedCustomizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filmTitle: string
  tmdbId: number
  mediaType: "movie" | "tv"
  visibility: "friends" | "public"
  selfName?: string
  selfUsername?: string
  selfAvatar?: string | null
  loading?: boolean
  onBack: () => void
  onPost: (payload: FeedPostPayload) => void | Promise<void>
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length) out.push(b[i])
  }
  return out
}

function imageKey(img: FeedImageChoice) {
  return `${img.kind}:${img.filePath}`
}

function tmdbUrl(img: FeedImageChoice) {
  const size = img.kind === "poster" ? "w780" : "w1280"
  return `https://image.tmdb.org/t/p/${size}${img.filePath}`
}

function collageTileClass(count: number, index: number) {
  if (count === 5) {
    return index < 2 ? "col-span-3" : "col-span-2"
  }
  return undefined
}

function CollagePreview({ images }: { images: FeedImageChoice[] }) {
  const n = images.length
  const gridClass =
    n <= 2
      ? "grid-cols-2"
      : n === 3
        ? "grid-cols-3"
        : n === 4
          ? "grid-cols-2"
          : n === 5
            ? "grid-cols-6"
            : "grid-cols-3"

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950">
      <div className={cn("grid aspect-[16/9] w-full gap-0.5 bg-black", gridClass)}>
        {images.map((img, i) => (
          <div
            key={imageKey(img)}
            className={cn("relative min-h-0 min-w-0 overflow-hidden", collageTileClass(n, i))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tmdbUrl(img)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewMedia({
  images,
  layout,
}: {
  images: FeedImageChoice[]
  layout: FeedImageLayout
}) {
  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, Math.max(0, images.length - 1))
  const current = images[safeIndex]

  useEffect(() => {
    setIndex(0)
  }, [images.length, images[0]?.filePath])

  if (!current) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-600">
        Select photos to preview
      </div>
    )
  }

  if (images.length > 1 && layout === "collage") {
    return <CollagePreview images={images} />
  }

  const isPoster = current.kind === "poster"

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950">
      <div
        className={cn(
          "relative w-full overflow-hidden",
          isPoster ? "aspect-[2/3] max-h-[320px]" : "aspect-[16/9]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tmdbUrl(current)}
          alt=""
          className="h-full w-full object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
              onClick={() =>
                setIndex((i) => (i - 1 + images.length) % images.length)
              }
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
              {images.map((img, i) => (
                <span
                  key={imageKey(img)}
                  className={cn(
                    "size-1.5 rounded-full",
                    i === safeIndex ? "bg-white" : "bg-white/35",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function FeedCustomizeDialog({
  open,
  onOpenChange,
  filmTitle,
  tmdbId,
  mediaType,
  visibility,
  selfName,
  selfUsername,
  selfAvatar,
  loading = false,
  onBack,
  onPost,
}: FeedCustomizeDialogProps) {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState<FeedImageChoice[]>([])
  const [postTitle, setPostTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [layout, setLayout] = useState<FeedImageLayout>("slide")
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (!open || !tmdbId) return

    let cancelled = false
    const run = async () => {
      setFetching(true)
      setSelected([])
      setPostTitle("")
      setCaption("")
      setLayout("slide")
      setImages([])
      try {
        const res = await fetch(
          `/api/movies/${tmdbId}/images?media_type=${mediaType}`,
        )
        const data = await res.json()
        if (cancelled) return

        type TmdbImg = { file_path: string; vote_average?: number }
        const byVotes = (a: TmdbImg, b: TmdbImg) =>
          (b.vote_average ?? 0) - (a.vote_average ?? 0)

        const posters = ([...(data.posters || [])] as TmdbImg[])
          .sort(byVotes)
          .map((img) => ({
            filePath: img.file_path,
            kind: "poster" as const,
            url: `https://image.tmdb.org/t/p/w500${img.file_path}`,
          }))

        const backdrops = ([...(data.backdrops || [])] as TmdbImg[])
          .sort(byVotes)
          .map((img) => ({
            filePath: img.file_path,
            kind: "backdrop" as const,
            url: `https://image.tmdb.org/t/p/w780${img.file_path}`,
          }))

        const mixed = interleave(posters, backdrops)
        setImages(mixed)
        if (mixed[0]) {
          setSelected([{ filePath: mixed[0].filePath, kind: mixed[0].kind }])
        }
      } catch (e) {
        console.error("[feed-customize]", e)
      } finally {
        if (!cancelled) setFetching(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [open, tmdbId, mediaType])

  const selectedIndex = useMemo(() => {
    const map = new Map<string, number>()
    selected.forEach((img, i) => map.set(imageKey(img), i + 1))
    return map
  }, [selected])

  const toggleImage = (img: FeedImageChoice) => {
    const key = imageKey(img)
    setSelected((prev) => {
      const exists = prev.findIndex((p) => imageKey(p) === key)
      if (exists >= 0) {
        return prev.filter((_, i) => i !== exists)
      }
      if (prev.length >= MAX_IMAGES) return prev
      return [...prev, img]
    })
  }

  const handlePost = async () => {
    if (selected.length === 0) return
    setPosting(true)
    try {
      await onPost({
        images: selected,
        title: postTitle.trim(),
        caption: caption.trim(),
        layout: selected.length > 1 ? layout : "slide",
      })
      onOpenChange(false)
    } finally {
      setPosting(false)
    }
  }

  const busy = loading || posting || fetching
  const previewName = selfName?.trim() || selfUsername || "You"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4">
          <DialogTitle>Customize post</DialogTitle>
          <DialogDescription>
            Build your post for{" "}
            <span className="text-foreground">{filmTitle}</span>
            {" · "}
            {visibility === "public" ? "Public" : "Friends"}
          </DialogDescription>
        </DialogHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <div className="border-b border-border px-5 py-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Photos</p>
                <p className="text-xs text-muted-foreground">
                  {selected.length}/{MAX_IMAGES} selected
                </p>
              </div>

              {fetching ? (
                <ReactMasonryCss
                  breakpointCols={{ default: 3, 640: 2, 420: 1 }}
                  className="my-masonry-grid"
                  columnClassName="my-masonry-grid_column"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="masonry-item overflow-hidden rounded-lg ring-1 ring-white/[0.06]"
                      style={{ aspectRatio: i % 2 === 0 ? "2/3" : "16/9" }}
                    >
                      <Skeleton className="h-full w-full" />
                    </div>
                  ))}
                </ReactMasonryCss>
              ) : images.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No images found for this title.
                </p>
              ) : (
                <ReactMasonryCss
                  breakpointCols={{ default: 3, 640: 2, 420: 1 }}
                  className="my-masonry-grid"
                  columnClassName="my-masonry-grid_column"
                >
                  {images.map((img) => {
                    const order = selectedIndex.get(imageKey(img))
                    const isSelected = Boolean(order)
                    return (
                      <button
                        key={imageKey(img)}
                        type="button"
                        disabled={busy || (!isSelected && selected.length >= MAX_IMAGES)}
                        onClick={() => toggleImage(img)}
                        className={cn(
                          "masonry-item group relative block w-full overflow-hidden rounded-lg text-left ring-1 transition",
                          isSelected
                            ? "ring-2 ring-[#FF0048]"
                            : "ring-white/[0.06] hover:ring-white/20",
                          !isSelected &&
                            selected.length >= MAX_IMAGES &&
                            "opacity-40",
                        )}
                        style={{
                          aspectRatio: img.kind === "poster" ? "2/3" : "16/9",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {isSelected ? (
                          <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-[#FF0048] text-[11px] font-semibold text-white">
                            {order}
                          </span>
                        ) : (
                          <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border border-white/30 bg-black/40 opacity-0 transition group-hover:opacity-100">
                            <Check className="size-3.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </ReactMasonryCss>
              )}
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
                <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-3">
                  <div className="mb-2 flex items-start gap-2.5">
                    <Avatar className="mt-0.5 size-8 border border-white/[0.08]">
                      <AvatarImage
                        src={avatarDisplaySrc(selfAvatar) ?? undefined}
                        alt=""
                      />
                      <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-300">
                        {previewName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5 text-[13px]">
                        <span className="font-semibold text-zinc-100">
                          {previewName}
                        </span>
                        {selfUsername ? (
                          <span className="text-zinc-600">@{selfUsername}</span>
                        ) : null}
                        <span className="text-zinc-600">· now</span>
                      </div>
                      <p className="text-[13px] text-zinc-500">
                        watched{" "}
                        <span className="font-medium text-zinc-100">
                          {filmTitle}
                        </span>
                      </p>
                    </div>
                  </div>
                  <PreviewMedia images={selected} layout={layout} />
                  {postTitle.trim() ? (
                    <p className="mt-2.5 text-sm font-semibold text-zinc-100">
                      {postTitle.trim()}
                    </p>
                  ) : null}
                  {caption.trim() ? (
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-300">
                      {caption.trim()}
                    </p>
                  ) : null}
                </div>
              </div>

              {selected.length > 1 ? (
                <div className="space-y-2">
                  <Label>Photo layout</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setLayout("slide")}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                        layout === "slide"
                          ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                          : "border-border/80 hover:border-border",
                      )}
                    >
                      <GalleryHorizontal className="size-4 text-[#FF0048]" />
                      <span className="text-xs font-medium">Slide</span>
                      <span className="text-[10px] text-muted-foreground">
                        Swipe one by one
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setLayout("collage")}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                        layout === "collage"
                          ? "border-[#FF0048]/40 bg-[#FF0048]/10"
                          : "border-border/80 hover:border-border",
                      )}
                    >
                      <LayoutGrid className="size-4 text-[#FF0048]" />
                      <span className="text-xs font-medium">All in one</span>
                      <span className="text-[10px] text-muted-foreground">
                        Grid collage
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="feed-post-title">Title (optional)</Label>
                <Input
                  id="feed-post-title"
                  value={postTitle}
                  maxLength={TITLE_MAX}
                  disabled={busy}
                  placeholder="A short headline for your post"
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {postTitle.length}/{TITLE_MAX}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feed-post-caption">Caption (optional)</Label>
                <Textarea
                  id="feed-post-caption"
                  value={caption}
                  maxLength={CAPTION_MAX}
                  disabled={busy}
                  placeholder="What did you think? Spoiler-free takes welcome…"
                  className="min-h-[110px] resize-none"
                  onChange={(e) => setCaption(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  {caption.length}/{CAPTION_MAX}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-5 py-3 sm:justify-between">
          <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#FF0048] text-white hover:bg-[#e60042]"
              disabled={busy || selected.length === 0}
              onClick={() => void handlePost()}
            >
              {posting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Posting…
                </>
              ) : (
                "Post to feed"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
