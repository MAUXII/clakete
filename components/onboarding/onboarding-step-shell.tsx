"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface OnboardingStepShellProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  align?: "center" | "start"
  /** Empurra o footer para o rodapé da área útil (steps 1–2). */
  pinFooter?: boolean
}

export function OnboardingStepShell({
  title,
  description,
  children,
  footer,
  className,
  align = "center",
  pinFooter = false,
}: OnboardingStepShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-col px-3 sm:px-4",
        pinFooter && "min-h-0 flex-1",
        align === "center" && "items-center",
        className,
      )}
    >
      <div className="min-w-0 w-full shrink-0 text-center">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-[13px]">{description}</p>
        ) : null}
      </div>
      <div
        className={cn(
          "mt-8 w-full",
          pinFooter && "flex min-h-0 flex-1 flex-col",
          align === "center" && "flex flex-col items-center",
        )}
      >
        {children}
      </div>
      {footer ? (
        <div
          className={cn(
            "w-full shrink-0 pt-8",
            pinFooter &&
              "mt-auto pb-[max(1rem,env(safe-area-inset-bottom))]",
            align === "center" && "flex flex-col items-center",
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
