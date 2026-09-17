"use client"

import { useEffect, useState } from "react"

const PLACEHOLDER_TINTS = [
  "rgb(52, 24, 20)",
  "rgb(16, 34, 46)",
  "rgb(16, 40, 30)",
  "rgb(36, 20, 48)",
  "rgb(42, 32, 12)",
  "rgb(22, 22, 42)",
] as const

export function atmosphereSeedIndex(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6
  }
  return hash
}

export function atmospherePlaceholderTint(seed: string) {
  return PLACEHOLDER_TINTS[atmosphereSeedIndex(seed)] ?? "rgb(14, 16, 20)"
}

/** Load URL for canvas sampling (TMDB needs same-origin proxy). */
export function atmosphereLoadSrc(coverUrl: string) {
  return coverUrl.includes("image.tmdb.org")
    ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
    : coverUrl
}

/**
 * GIFs (and similar) must never drive the hub wash live — the blur would
 * animate. Prefer freezing a still; if we cannot, treat as animated.
 */
export function isLikelyAnimatedCover(url: string) {
  const path = (url.split("?")[0] ?? "").toLowerCase()
  return path.endsWith(".gif") || path.endsWith(".apng")
}

function averageTintFromImage(img: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas")
  const size = 32
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
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
  if (n <= 0) return null
  return `rgb(${Math.round((r / n) * 0.45)}, ${Math.round((g / n) * 0.45)}, ${Math.round((b / n) * 0.45)})`
}

/** Still frame for atmosphere wash (blurred, so low-res JPEG is enough). */
function freezeStillFrame(img: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas")
  const max = 640
  const nw = img.naturalWidth || img.width
  const nh = img.naturalHeight || img.height
  if (!nw || !nh) return null
  const scale = Math.min(1, max / Math.max(nw, nh))
  canvas.width = Math.max(1, Math.round(nw * scale))
  canvas.height = Math.max(1, Math.round(nh * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  try {
    return canvas.toDataURL("image/jpeg", 0.82)
  } catch {
    return null
  }
}

/**
 * Hub / media atmosphere image: tint + a frozen wash src that never animates.
 */
export function useAtmosphereWashSource(
  coverUrl: string | null,
  seed: string,
) {
  const fallbackTint = atmospherePlaceholderTint(seed)
  const [tint, setTint] = useState<string>(fallbackTint)
  const [washSrc, setWashSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!coverUrl) {
      setTint(atmospherePlaceholderTint(seed))
      setWashSrc(null)
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (cancelled) return
      try {
        const nextTint = averageTintFromImage(img)
        if (nextTint) setTint(nextTint)
        const still = freezeStillFrame(img)
        if (still) {
          setWashSrc(still)
          return
        }
      } catch {
        /* tainted canvas */
      }
      // Never fall back to a live GIF URL — wash must stay still.
      if (isLikelyAnimatedCover(coverUrl)) {
        setWashSrc(null)
      } else {
        setWashSrc(coverUrl)
      }
    }
    img.onerror = () => {
      if (cancelled) return
      setTint(atmospherePlaceholderTint(seed))
      setWashSrc(isLikelyAnimatedCover(coverUrl) ? null : coverUrl)
    }
    img.src = atmosphereLoadSrc(coverUrl)
    return () => {
      cancelled = true
    }
  }, [coverUrl, seed])

  return { tint, washSrc }
}
