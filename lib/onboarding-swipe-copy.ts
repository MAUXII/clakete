import type { SwipeStepCopy } from "@/components/list-new/new-list-swipe-step"

export const ONBOARDING_SWIPE_COPY: Partial<SwipeStepCopy> = {
  title: "What have you watched?",
  description: "Swipe right if you've seen it, left if you haven't. We'll tailor your feed.",
  skipLabel: "Haven't seen",
  addLabel: "Watched",
  rightOverlay: "Watched",
  leftOverlay: "Skip",
  rightHint: "Watched",
  leftHint: "Haven't seen",
  finishLabel: "Finish setup",
  emptyNoGenres: "No suggestions here. Go back and pick at least one genre.",
  emptyNoMore: "No more suggestions right now. You can still finish with what you marked.",
  footnoteNoMore: "Couldn't load more titles. Finish with what you have or adjust genres.",
}
