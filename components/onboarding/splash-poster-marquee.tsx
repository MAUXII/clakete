"use client"

import { ThreeDMarquee } from "@/components/ui/3d-marquee"
import { SPLASH_POSTER_URLS } from "@/lib/splash-poster-urls"

/** Full-screen poster grid behind splash content (below Velaris). */
export function SplashPosterMarquee() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-[0.38] saturate-[0.85]">
        <ThreeDMarquee
          images={SPLASH_POSTER_URLS}
          variant="poster"
          showGrid={false}
          className="mx-0 h-dvh max-h-none rounded-none max-sm:h-dvh"
        />
      </div>
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_48%,transparent_0%,#09090B_55%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#09090B]/50 via-transparent to-[#09090B]/65"
        aria-hidden
      />
    </div>
  )
}
