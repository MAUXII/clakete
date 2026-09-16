"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const FADE =
  "linear-gradient(180deg, #000 0%, #000 22%, rgba(0,0,0,0.55) 48%, transparent 82%)"

const PLACEHOLDER_TINTS = [
  "rgb(48, 22, 18)",
  "rgb(16, 32, 44)",
  "rgb(16, 38, 28)",
  "rgb(34, 18, 46)",
  "rgb(40, 30, 14)",
  "rgb(22, 22, 40)",
] as const

function seedIndex(seed?: string) {
  if (!seed) return 0
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6
  }
  return hash
}

/**
 * Leitour-style blurred atmosphere wash behind media pages (films, series).
 * Creates a rich cinematic ambiance from the media poster or backdrop.
 */
export function MediaAtmosphere({
  coverUrl,
  seed = "clakete",
  className,
  soft = false,
  contained = false,
}: {
  coverUrl: string | null
  seed?: string
  className?: string
  soft?: boolean
  contained?: boolean
}) {
  const [tint, setTint] = useState<string>(
    () => PLACEHOLDER_TINTS[seedIndex(seed)] ?? "rgb(14, 16, 20)",
  )

  useEffect(() => {
    if (!coverUrl) {
      setTint(PLACEHOLDER_TINTS[seedIndex(seed)] ?? "rgb(14, 16, 20)")
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const size = 32
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0
        let g = 0
        let b = 0
        let n = 0
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3] ?? 0
          if (a < 200) continue
          r += data[i] ?? 0
          g += data[i + 1] ?? 0
          b += data[i + 2] ?? 0
          n += 1
        }
        if (!cancelled && n > 0) {
          setTint(
            `rgb(${Math.round((r / n) * 0.45)}, ${Math.round((g / n) * 0.45)}, ${Math.round((b / n) * 0.45)})`,
          )
        }
      } catch {
        /* fallback to placeholder */
      }
    }

    // Use our internal proxy for TMDB images so CORS never fails
    const sampleSrc = coverUrl.includes("image.tmdb.org")
      ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
      : coverUrl

    img.src = sampleSrc
    return () => {
      cancelled = true
    }
  }, [coverUrl, seed])

  useEffect(() => {
    if (contained) return
    const root = document.documentElement
    root.dataset.ckAtmosphere = "tint"
    return () => {
      delete root.dataset.ckAtmosphere
    }
  }, [contained])

  const wash = contained
    ? "absolute -top-[30%] left-1/2 h-[160%] w-[220%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[90px]"
    : "absolute -top-[20%] left-1/2 h-[110vh] w-[170%] max-w-none -translate-x-1/2 scale-110 object-cover blur-[110px]"

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none z-0 overflow-hidden transition-[background] duration-700",
        contained ? "absolute inset-0" : "fixed inset-0",
        className,
      )}
      style={{ background: tint }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className={cn(wash, soft ? "opacity-25" : "opacity-70")}
          style={{ maskImage: FADE, WebkitMaskImage: FADE }}
        />
      ) : (
        <div
          className={cn(wash, soft ? "opacity-20" : "opacity-55")}
          style={{
            background: tint,
            maskImage: FADE,
            WebkitMaskImage: FADE,
          }}
        />
      )}
      <div
        className={
          soft
            ? "absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25"
            : "absolute inset-0 bg-gradient-to-b from-black/20 via-black/25 to-black/45"
        }
      />
    </div>
  )
}
