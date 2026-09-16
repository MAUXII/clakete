"use client"

import { useEffect, useMemo, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import {
  ATMOSPHERE_PRESETS,
  type AtmosphereMode,
  type AtmospherePreset,
} from "@/lib/atmosphere"
import { useAtmosphereWashSource } from "@/hooks/use-atmosphere-wash-source"

function washStyle(preset: AtmospherePreset): CSSProperties {
  const left = preset.anchor === "left" ? (preset.left ?? "0") : "50%"
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
  const preset = useMemo(() => {
    if (mode === "off") return null
    return ATMOSPHERE_PRESETS[mode]
  }, [mode])

  const { tint, washSrc } = useAtmosphereWashSource(
    preset ? coverUrl : null,
    seed,
  )

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
      {washSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={washSrc}
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
