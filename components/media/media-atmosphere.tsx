"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAtmosphereWashSource } from "@/hooks/use-atmosphere-wash-source"

const FADE =
  "linear-gradient(180deg, #000 0%, #000 22%, rgba(0,0,0,0.55) 48%, transparent 82%)"

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
  const { tint, washSrc } = useAtmosphereWashSource(coverUrl, seed)

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
      {washSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={washSrc}
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
