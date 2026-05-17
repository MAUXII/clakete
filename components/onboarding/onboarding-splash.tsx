"use client"

import { AnimatePresence, motion } from "framer-motion"
import Velaris from "@/components/forgeui/velaris"
import { SplashPosterMarquee } from "@/components/onboarding/splash-poster-marquee"
import { HandWrittenTitle } from "@/components/ui/hand-writing-text"

/** Velaris shader palette — Clakete pink / crimson on near-black. */
const CLAKETE_VELARIS_COLORS = ["#FF0048", "#e94e7a", "#9b1c3a", "#2a0812"] as const

interface OnboardingSplashProps {
  visible: boolean
  onComplete: () => void
}

export function OnboardingSplash({ visible, onComplete }: OnboardingSplashProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="onboarding-splash"
          className="fixed inset-0 z-50 bg-[#09090B]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <SplashPosterMarquee />

          <div className="pointer-events-none absolute inset-0 z-[1] opacity-[0.18]" aria-hidden>
            <Velaris
              bg="#09090B"
              colors={[...CLAKETE_VELARIS_COLORS]}
              speed={1.15}
              grain={0.2}
              height="100dvh"
              className="h-dvh min-h-dvh w-full"
            />
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="relative z-10 flex h-dvh min-h-dvh w-full cursor-pointer flex-col items-center border-0 bg-transparent px-6 pb-10 pt-8 outline-none focus-visible:ring-2 focus-visible:ring-[#FF0048]/50"
            aria-label="Continue to onboarding"
          >
            <div className="flex flex-1 flex-col items-center justify-center">
              <HandWrittenTitle />
            </div>

            <motion.span
              className="shrink-0 pb-2 text-xs font-medium uppercase tracking-[0.22em] text-zinc-600 sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2, duration: 0.6 }}
            >
              Tap anywhere to continue
            </motion.span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
