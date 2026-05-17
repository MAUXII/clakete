"use client"

import { ThreeDMarquee } from "@/components/ui/3d-marquee"
import { SPLASH_POSTER_URLS } from "@/lib/splash-poster-urls"

export default function ThreeDMarqueeDemo() {
  return (
    <div className="mx-auto my-10 max-w-7xl rounded-3xl bg-gray-950/5 p-2 ring-1 ring-neutral-700/10 dark:bg-neutral-800">
      <ThreeDMarquee images={SPLASH_POSTER_URLS} variant="poster" showGrid={false} />
    </div>
  )
}
