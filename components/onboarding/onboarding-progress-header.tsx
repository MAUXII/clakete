"use client"

import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilmsProgress {
  count: number
  min: number
  fillPercent: number
  semanticPercent: number
}

interface OnboardingProgressHeaderProps {
  step: number
  totalSteps?: number
  onBack: () => void
  backLabel?: string
  filmsProgress?: FilmsProgress
}

export function OnboardingProgressHeader({
  step,
  totalSteps = 4,
  onBack,
  backLabel = "Previous step",
  filmsProgress,
}: OnboardingProgressHeaderProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <header className="mb-5 mt-28 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors hover:text-white"
        aria-label={step === 1 ? "Back" : backLabel}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex w-[200px] shrink-0 items-center gap-1.5 sm:w-[220px] sm:gap-2">
        {steps.map((s) => {
          if (s === 4 && step === 4 && filmsProgress) {
            return (
              <div
                key={s}
                className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
                aria-valuenow={Math.round(filmsProgress.semanticPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Watched: ${filmsProgress.count} of ${filmsProgress.min}`}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#FF0048] transition-[width] duration-300 ease-out"
                  style={{ width: `${filmsProgress.fillPercent}%` }}
                />
              </div>
            )
          }

          const filled = step > s || (step === s && s < 4)
          return (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                filled ? "bg-[#FF0048]" : step === s ? "bg-[#FF0048]/70" : "bg-white/15",
              )}
              role="progressbar"
              aria-valuenow={step >= s ? 100 : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Step ${s} of ${totalSteps}`}
            />
          )
        })}
      </div>
    </header>
  )
}
