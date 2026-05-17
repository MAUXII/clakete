"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell"
import { onboardingContinueButtonClass } from "@/components/onboarding/onboarding-step-actions"

interface OnboardingDisplayNameStepProps {
  displayName: string
  username: string
  onDisplayNameChange: (value: string) => void
  onContinue: () => void
}

export function OnboardingDisplayNameStep({
  displayName,
  username,
  onDisplayNameChange,
  onContinue,
}: OnboardingDisplayNameStepProps) {
  return (
    <OnboardingStepShell
      pinFooter
      title="What should we call you?"
      description="This is how your name appears on your profile and reviews. You can change it anytime."
      footer={
        <Button type="button" onClick={onContinue} className={onboardingContinueButtonClass}>
          Continue
        </Button>
      }
    >
      <div className="mx-auto w-full max-w-md space-y-2 text-center">
       
        <Input
          id="onboarding-display-name"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder={username}
          maxLength={50}
          className="border-white/10 bg-white/[0.03] py-6 text-center text-white placeholder:text-zinc-600"
          onKeyDown={(e) => {
            if (e.key === "Enter") onContinue()
          }}
        />
        
      </div>
    </OnboardingStepShell>
  )
}
