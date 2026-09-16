"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import {
  ATMOSPHERE_PRESETS,
  type AtmosphereMode,
  type AtmospherePreset,
} from "@/lib/atmosphere"

const PLACEHOLDER_TINTS = [
  "rgb(52, 24, 20)",
  "rgb(16, 34, 46)",
  "rgb(16, 40, 30)",
  "rgb(36, 20, 48)",
  "rgb(42, 32, 12)",
  "rgb(22, 22, 42)",
] as const

function seedIndex(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 6
  }
  return hash
}

function washStyle(preset: AtmospherePreset): CSSProperties {
  const left =
    preset.anchor === "left"
      ? preset.left ?? "0"
      : "50%"
  return {
    top: preset.top,
    left,
    height: preset.height,
    width: preset.width,
    transform:
      preset.anchor === "center"
        ? `translateX(-50%) scale(${preset.scale})`
        : `scale(${preset.scale})`,
    opacity: preset.opacity,
    filter: `blur(${preset.blurPx}px)`,
    maskImage: preset.maskImage,
    WebkitMaskImage: preset.maskImage,
  }
}

/** Leitour / Rorscharch-style blurred wash behind the Glass profile shell. */
export function ProfileAtmosphere({
  coverUrl,
  seed,
  mode = "vivid",
  className,
}: {
  coverUrl: string | null
  seed: string
  mode?: AtmosphereMode
  className?: string
}) {
  const [tint, setTint] = useState<string>(
    () => PLACEHOLDER_TINTS[seedIndex(seed)] ?? "rgb(14, 16, 20)",
  )

  const preset = useMemo(() => {
    if (mode === "off") return null
    return ATMOSPHERE_PRESETS[mode]
  }, [mode])

  useEffect(() => {
    if (!coverUrl || !preset) {
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
        /* CORS / tainted canvas — keep placeholder */
      }
    }
    const sampleSrc = coverUrl.includes("image.tmdb.org")
      ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
      : coverUrl
    img.src = sampleSrc
    return () => {
      cancelled = true
    }
  }, [coverUrl, seed, preset])

  useEffect(() => {
    if (!preset) {
      delete document.documentElement.dataset.ckAtmosphere
      return
    }
    const root = document.documentElement
    root.dataset.ckAtmosphere = "tint"
    return () => {
      delete root.dataset.ckAtmosphere
    }
  }, [preset])

  if (!preset) return null

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden transition-[background] duration-700",
        className,
      )}
      style={{
        background: preset.showTintBg ? tint : "#151618",
        ...(preset.clipHeight
          ? { clipPath: `inset(0 0 calc(100% - ${preset.clipHeight}) 0)` }
          : null),
      }}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute max-w-none object-cover"
          style={washStyle(preset)}
        />
      ) : (
        <div
          className="absolute max-w-none"
          style={{
            ...washStyle(preset),
            background: tint,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: preset.washGradient }}
      />
    </div>
  )
}
