"use client"

import { useRive } from "@rive-app/react-canvas"

export function LegalFooterCat() {
  const { RiveComponent } = useRive({
    src: "/cat1.riv",
    artboard: "Artboard",
    stateMachines: ["State Machine 1"],
    autoplay: true,
  })

  return (
    <div className="flex w-full items-end justify-end">
      <RiveComponent
        width={400}
        className="flex h-20 max-w-[222px] translate-y-[36px] items-end justify-start self-end pl-9"
      />
    </div>
  )
}
