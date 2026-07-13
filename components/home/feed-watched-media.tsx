"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { animate, motion, useMotionValue } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export const feedMediaFrameClass =
  "group/media relative mt-3 block overflow-hidden bg-zinc-950 " +
  "-mx-4 w-[calc(100%+2rem)] rounded-none border-y border-white/[0.06] " +
  "lg:mx-0 lg:w-full lg:rounded-2xl lg:border lg:border-white/[0.08]"

function tmdbSrc(filePath: string, kind: "poster" | "backdrop") {
  const size = kind === "poster" ? "w780" : "w1280"
  return `https://image.tmdb.org/t/p/${size}${filePath}`
}

const DISMISS_DISTANCE = 130
const DISMISS_VELOCITY = 650
/** degrees per px of horizontal travel — keeps tilting through the fling */
const TILT_PER_PX = 0.048

/**
 * Letterboxd-style lightbox:
 * free X/Y drag, tilt follows horizontal offset (doesn't freeze),
 * backdrop fades, spring home or fling away with continuing spin.
 */
function MediaLightbox({
  open,
  onClose,
  src,
  alt,
  kind = "backdrop",
  onPrev,
  onNext,
  hasNav,
}: {
  open: boolean
  onClose: () => void
  src: string
  alt: string
  kind?: "poster" | "backdrop"
  onPrev?: () => void
  onNext?: () => void
  hasNav?: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useMotionValue(0)
  const scale = useMotionValue(1)
  const overlayOpacity = useMotionValue(0.88)

  const pointerId = useRef<number | null>(null)
  const start = useRef({ x: 0, y: 0, px: 0, py: 0, t: 0 })
  const lastSample = useRef({ x: 0, y: 0, t: 0 })
  const closing = useRef(false)

  const syncVisuals = useCallback(
    (nx: number, ny: number) => {
      const dist = Math.hypot(nx, ny)
      x.set(nx)
      y.set(ny)
      rotate.set(nx * TILT_PER_PX)
      // subtle shrink — not “sucked in”
      scale.set(Math.max(0.92, 1 - dist / 1800))
      overlayOpacity.set(Math.max(0, 0.88 - dist / 380))
    },
    [overlayOpacity, rotate, scale, x, y],
  )

  const reset = useCallback(() => {
    x.set(0)
    y.set(0)
    rotate.set(0)
    scale.set(1)
    overlayOpacity.set(0.88)
    closing.current = false
  }, [overlayOpacity, rotate, scale, x, y])

  useEffect(() => {
    if (!open) return
    reset()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev?.()
      if (e.key === "ArrowRight") onNext?.()
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, onPrev, onNext, reset])

  useEffect(() => {
    if (open) reset()
  }, [src, open, reset])

  const springHome = useCallback(() => {
    const spring = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.85 }
    void animate(x, 0, spring)
    void animate(y, 0, spring)
    void animate(rotate, 0, spring)
    void animate(scale, 1, spring)
    void animate(overlayOpacity, 0.88, { duration: 0.25, ease: "easeOut" })
  }, [overlayOpacity, rotate, scale, x, y])

  const flingAway = useCallback(
    async (vx: number, vy: number, ox: number, oy: number) => {
      if (closing.current) return
      closing.current = true

      const speed = Math.hypot(vx, vy)
      const dirX = Math.abs(vx) > 40 || Math.abs(vy) > 40 ? vx : ox
      const dirY = Math.abs(vx) > 40 || Math.abs(vy) > 40 ? vy : oy
      const len = Math.hypot(dirX, dirY) || 1
      const ux = dirX / len
      const uy = dirY / len

      // fly far enough to leave the viewport, boosted by flick speed
      const fly = Math.min(2200, 900 + speed * 0.55)
      const targetX = ox + ux * fly
      const targetY = oy + uy * fly
      // tilt keeps growing with X — no angle lock at the end of the drag
      const targetRotate = targetX * TILT_PER_PX
      const duration = Math.min(0.45, Math.max(0.28, 0.5 - speed / 8000))

      await Promise.all([
        animate(x, targetX, { duration, ease: "easeOut" }),
        animate(y, targetY, { duration, ease: "easeOut" }),
        animate(rotate, targetRotate, { duration, ease: "easeOut" }),
        animate(scale, 0.88, { duration, ease: "easeOut" }),
        animate(overlayOpacity, 0, { duration: duration * 0.85, ease: "easeOut" }),
      ])
      onClose()
      reset()
    },
    [onClose, overlayOpacity, reset, rotate, scale, x, y],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (closing.current || e.button !== 0) return
    pointerId.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const now = performance.now()
    start.current = {
      x: x.get(),
      y: y.get(),
      px: e.clientX,
      py: e.clientY,
      t: now,
    }
    lastSample.current = { x: e.clientX, y: e.clientY, t: now }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    const nx = start.current.x + (e.clientX - start.current.px)
    const ny = start.current.y + (e.clientY - start.current.py)
    syncVisuals(nx, ny)
    lastSample.current = { x: e.clientX, y: e.clientY, t: performance.now() }
  }

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }

    const ox = x.get()
    const oy = y.get()
    const dist = Math.hypot(ox, oy)

    // recent velocity for flick feel
    const sampleDt = Math.max(12, performance.now() - lastSample.current.t)
    const recentVx =
      ((e.clientX - lastSample.current.x) / sampleDt) * 1000
    const recentVy =
      ((e.clientY - lastSample.current.y) / sampleDt) * 1000
    const throwDt = Math.max(16, performance.now() - start.current.t)
    const avgVx = (ox / throwDt) * 1000
    const avgVy = (oy / throwDt) * 1000
    const vx = Math.abs(recentVx) > Math.abs(avgVx) ? recentVx : avgVx
    const vy = Math.abs(recentVy) > Math.abs(avgVy) ? recentVy : avgVy
    const vel = Math.hypot(vx, vy)

    if (dist > DISMISS_DISTANCE || vel > DISMISS_VELOCITY) {
      void flingAway(vx, vy, ox, oy)
      return
    }

    springHome()
  }

  if (!open) return null

  const imgClass =
    kind === "poster"
      ? "max-h-[min(88vh,920px)] max-w-[min(92vw,560px)] select-none rounded-sm object-contain shadow-2xl"
      : "max-h-[min(88vh,920px)] w-[min(96vw,1280px)] max-w-[96vw] select-none rounded-sm object-contain shadow-2xl"

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <motion.button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 z-0 cursor-default bg-black"
        style={{ opacity: overlayOpacity }}
        onClick={() => {
          if (pointerId.current != null || closing.current) return
          onClose()
        }}
      />

      <button
        type="button"
        aria-label="Close"
        className="absolute right-4 top-4 z-30 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>

      {hasNav ? (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
            onClick={onPrev}
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
            onClick={onNext}
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-5">
        <motion.div
          className="pointer-events-auto relative cursor-grab touch-none will-change-transform active:cursor-grabbing"
          style={{ x, y, rotate, scale }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={imgClass}
          />
        </motion.div>
      </div>
    </div>
  )
}

function FullBleedMedia({
  imagePath,
  imageKind,
  title,
  edgeToEdge = true,
  onDoubleLike,
}: {
  imagePath: string | null
  imageKind?: "poster" | "backdrop" | null
  title: string
  edgeToEdge?: boolean
  onDoubleLike?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPoster = imageKind === "poster"
  const aspectClass = isPoster ? "aspect-[2/3] max-h-[70vh]" : "aspect-[16/9]"
  const frame = edgeToEdge
    ? feedMediaFrameClass
    : "group/media relative mt-3 block overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950"

  useEffect(() => {
    return () => {
      if (expandTimer.current) clearTimeout(expandTimer.current)
    }
  }, [])

  const scheduleExpand = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current)
    expandTimer.current = setTimeout(() => {
      setExpanded(true)
      expandTimer.current = null
    }, 280)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (expandTimer.current) {
      clearTimeout(expandTimer.current)
      expandTimer.current = null
    }
    onDoubleLike?.()
  }

  if (!imagePath) {
    return (
      <div className={frame}>
        <div
          className={cn(
            "flex w-full items-center justify-center bg-zinc-900 text-sm text-zinc-600",
            aspectClass,
          )}
        >
          {title}
        </div>
      </div>
    )
  }

  const src = tmdbSrc(imagePath, isPoster ? "poster" : "backdrop")

  return (
    <>
      <button
        type="button"
        className={cn(frame, "w-full cursor-zoom-in text-left")}
        onClick={scheduleExpand}
        onDoubleClick={handleDoubleClick}
        aria-label={`Expand ${title}`}
      >
        <div className={cn("relative w-full overflow-hidden", aspectClass)}>
          <Image
            src={src}
            alt={title}
            fill
            quality={90}
            className="object-cover transition duration-500 group-hover/media:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 720px"
          />
        </div>
      </button>
      <MediaLightbox
        open={expanded}
        onClose={() => setExpanded(false)}
        src={src}
        alt={title}
        kind={isPoster ? "poster" : "backdrop"}
      />
    </>
  )
}

function collageTileClass(count: number, index: number) {
  if (count === 5) {
    return index < 2 ? "col-span-3" : "col-span-2"
  }
  return undefined
}

export function WatchedMediaCarousel({
  images,
  filmTitle,
  layout = "slide",
  edgeToEdge = true,
  onDoubleLike,
  /** @deprecated Media is not a film link anymore; kept optional for callers. */
  href: _href,
}: {
  images: { filePath: string; kind: "poster" | "backdrop" }[]
  filmTitle: string
  layout?: "slide" | "collage"
  edgeToEdge?: boolean
  onDoubleLike?: () => void
  href?: string
}) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safeIndex = Math.min(index, Math.max(0, images.length - 1))
  const current = images[safeIndex]
  const frame = edgeToEdge
    ? feedMediaFrameClass
    : "group/media relative mt-3 block overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950"

  useEffect(() => {
    return () => {
      if (expandTimer.current) clearTimeout(expandTimer.current)
    }
  }, [])

  const scheduleExpand = useCallback(() => {
    if (expandTimer.current) clearTimeout(expandTimer.current)
    expandTimer.current = setTimeout(() => {
      setExpanded(true)
      expandTimer.current = null
    }, 280)
  }, [])

  const handleDoubleLike = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (expandTimer.current) {
        clearTimeout(expandTimer.current)
        expandTimer.current = null
      }
      onDoubleLike?.()
    },
    [onDoubleLike],
  )

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  if (!current) {
    return (
      <FullBleedMedia
        imagePath={null}
        title={filmTitle}
        edgeToEdge={edgeToEdge}
        onDoubleLike={onDoubleLike}
      />
    )
  }

  if (images.length === 1) {
    return (
      <FullBleedMedia
        imagePath={current.filePath}
        imageKind={current.kind}
        title={filmTitle}
        edgeToEdge={edgeToEdge}
        onDoubleLike={onDoubleLike}
      />
    )
  }

  if (layout === "collage") {
    return (
      <>
        <button
          type="button"
          className={cn(frame, "w-full cursor-zoom-in text-left")}
          onClick={scheduleExpand}
          onDoubleClick={handleDoubleLike}
          aria-label={`Expand ${filmTitle}`}
        >
          <div className="relative aspect-[16/9] w-full">
            <div
              className={cn(
                "absolute inset-0 grid gap-0.5 bg-black",
                images.length <= 2
                  ? "grid-cols-2"
                  : images.length === 3
                    ? "grid-cols-3"
                    : images.length === 4
                      ? "grid-cols-2"
                      : images.length === 5
                        ? "grid-cols-6"
                        : "grid-cols-3",
              )}
            >
              {images.map((img, i) => (
                <div
                  key={`${img.kind}-${img.filePath}`}
                  className={cn(
                    "relative min-h-0 min-w-0 overflow-hidden",
                    collageTileClass(images.length, i),
                  )}
                >
                  <Image
                    src={tmdbSrc(img.filePath, img.kind)}
                    alt=""
                    fill
                    quality={90}
                    className="object-cover transition duration-500 group-hover/media:scale-[1.04]"
                    sizes="(max-width: 1024px) 50vw, 360px"
                  />
                </div>
              ))}
            </div>
          </div>
        </button>
        <MediaLightbox
          open={expanded}
          onClose={() => setExpanded(false)}
          src={tmdbSrc(images[0].filePath, images[0].kind)}
          alt={filmTitle}
          kind={images[0].kind}
        />
      </>
    )
  }

  const size = current.kind === "poster" ? "w780" : "w1280"
  const currentSrc = `https://image.tmdb.org/t/p/${size}${current.filePath}`

  return (
    <>
      <div className={frame}>
        <div className="relative h-[min(70vh,32rem)] w-full overflow-hidden bg-zinc-950">
          <button
            type="button"
            className="absolute inset-0 block cursor-zoom-in"
            onClick={scheduleExpand}
            onDoubleClick={handleDoubleLike}
            aria-label={`Expand ${filmTitle}`}
          >
            <Image
              src={currentSrc}
              alt={filmTitle}
              fill
              quality={90}
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 720px"
            />
          </button>
          <button
            type="button"
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goPrev()
            }}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              goNext()
            }}
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
            {images.map((img, i) => (
              <span
                key={`${img.kind}-${img.filePath}`}
                className={cn(
                  "size-1.5 rounded-full",
                  i === safeIndex ? "bg-white" : "bg-white/35",
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <MediaLightbox
        open={expanded}
        onClose={() => setExpanded(false)}
        src={currentSrc}
        alt={filmTitle}
        kind={current.kind}
        hasNav
        onPrev={goPrev}
        onNext={goNext}
      />
    </>
  )
}

export function watchedItemImages(item: {
  feedImages: { filePath: string; kind: "poster" | "backdrop" }[]
  feedImagePath: string | null
  feedImageKind: "poster" | "backdrop" | null
  posterPath: string | null
}) {
  if (item.feedImages.length > 0) return item.feedImages
  if (item.feedImagePath) {
    return [
      {
        filePath: item.feedImagePath,
        kind: item.feedImageKind ?? ("backdrop" as const),
      },
    ]
  }
  if (item.posterPath) {
    return [{ filePath: item.posterPath, kind: "poster" as const }]
  }
  return []
}
