import { cn } from "@/lib/utils"

/** Conteúdo padrão: gutter fixo + largura máxima; em telas largas o mx-auto cria margem lateral sozinho. */
export const pageContainerClass = "mx-auto w-full max-w-6xl px-4"

/**
 * Clear fixed navbar (+ optional promo banner via --clakete-promo-h).
 * Prefer this over hard-coded mt-[3.75rem].
 */
export const pageBelowNavClass =
  "mt-[calc(3.75rem+var(--clakete-promo-h,0px))]"
