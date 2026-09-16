/** Conteúdo padrão: gutter fixo + largura máxima; em telas largas o mx-auto cria margem lateral sozinho. */
export const pageContainerClass = "mx-auto w-full max-w-6xl px-4"

/**
 * Glass / Leitour profile shell — same max width as Leitour `.lt-shell` (820px).
 * Prefer this over `pageContainerClass` inside ProfileShellGlass.
 */
export const glassProfileContainerClass = "ck-glass-shell"

/**
 * Glass / Leitour wide shell — same max width as Leitour `.lt-shell-wide` (1060px).
 * Used for movie & series details (BookStage style).
 */
export const glassWideContainerClass = "ck-glass-shell-wide"

/**
 * Clear fixed navbar (+ optional promo banner via --clakete-promo-h).
 * Prefer this over hard-coded mt values.
 */
export const pageBelowNavClass =
  "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))]"
