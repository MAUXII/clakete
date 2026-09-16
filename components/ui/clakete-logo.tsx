import { cn } from "@/lib/utils"

type ClaketeLogoProps = {
  className?: string
  title?: string
}

/**
 * Mark limpo: círculo sólido na cor da brand (`text-brand` / `--brand`).
 * Mesmo contrato de tamanho de antes (`size-6`, `h-9`, etc.).
 */
export function ClaketeLogo({ className, title = "Clakete" }: ClaketeLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-brand", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <circle cx="16" cy="16" r="16" fill="currentColor" />
    </svg>
  )
}
