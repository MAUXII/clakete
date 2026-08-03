import Link from "next/link"
import { cn } from "@/lib/utils"
import { pageContainerClass } from "@/lib/page-container"
import { LegalFooterCat } from "@/components/legal/legal-footer-cat"

export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <main className="relative z-10 mt-[calc(3.75rem+var(--clakete-promo-h,0px))] min-h-dvh bg-background pb-20 text-foreground">
      <div className={cn(pageContainerClass, "max-w-2xl pt-10 sm:pt-14")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Clakete
        </p>
        <h1 className="mt-3 font-sketch text-4xl tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: {updatedAt}
        </p>

        <article className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </article>

        <footer className="mt-14">
          <LegalFooterCat />
          <div className="mb-4 mt-1 h-[0.3px] w-full bg-muted-foreground/10" />
          <nav className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm">
            <Link href="/" className="text-foreground underline-offset-4 hover:underline">
              Início
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Privacidade
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Termos
            </Link>
          </nav>
        </footer>
      </div>
    </main>
  )
}

export function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
