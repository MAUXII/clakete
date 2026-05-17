"use client"

import { Button } from "@/components/ui/button"
import { GenrePickerGrid } from "@/components/list-new/genre-picker-grid"
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell"
import { onboardingContinueButtonClass } from "@/components/onboarding/onboarding-step-actions"
import { cn } from "@/lib/utils"

interface OnboardingGenresStepProps {
  selectedIds: number[]
  onChangeSelected: (ids: number[]) => void
  canContinue: boolean
  onContinue: () => void
}

export function OnboardingGenresStep({
  selectedIds,
  onChangeSelected,
  canContinue,
  onContinue,
}: OnboardingGenresStepProps) {
  return (
    <OnboardingStepShell
      pinFooter
      title="What do you like to watch?"
      description="Pick one or more genres — we'll suggest films in the next step based on your taste."
      footer={
        <Button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={cn(
            onboardingContinueButtonClass,
            !canContinue && "cursor-not-allowed opacity-40 hover:bg-[#FF0048]",
          )}
        >
          Continue
        </Button>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <GenrePickerGrid
          selectedIds={selectedIds}
          onChangeSelected={onChangeSelected}
          language="en-US"
          variant="list"
          className="w-full pb-2"
        />
      </div>
    </OnboardingStepShell>
  )
}
