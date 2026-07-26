"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

type FaceThumb = {
  name: string
  src: string | null
}

type FeaturedGameProps = {
  title: string
  description: string
  href: string
  cta: string
  availableLabel: string
  faces?: FaceThumb[]
  pathCaption?: string
}

/** Wide featured play surface — not a card grid tile. */
export function FeaturedGame({
  title,
  description,
  href,
  cta,
  availableLabel,
  faces = [],
  pathCaption,
}: FeaturedGameProps) {
  const a = faces[0]
  const b = faces[1]

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-border",
        "bg-background/40 transition",
        "hover:border-brand/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.1) 1px, transparent 1.2px)`,
          backgroundSize: "18px 18px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-brand/10 blur-3xl transition group-hover:bg-brand/15"
      />

      <div className="relative z-[1] flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-7">
        <div className="flex shrink-0 items-center justify-center gap-2 sm:gap-3">
          <PosterThumb src={a?.src ?? null} alt={a?.name ?? "A"} rotate={-2} />
          <div className="flex w-14 flex-col items-center gap-1 sm:w-20">
            <svg
              viewBox="0 0 80 20"
              className="h-4 w-full text-brand/60"
              aria-hidden
            >
              <path
                d="M2 12 C 20 4, 35 16, 50 8 S 70 6, 78 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeDasharray="3.5 2.5"
                strokeLinecap="round"
              />
            </svg>
            {pathCaption ? (
              <span className="hidden text-center text-[10px] leading-tight text-muted-foreground sm:block">
                {pathCaption}
              </span>
            ) : null}
          </div>
          <PosterThumb src={b?.src ?? null} alt={b?.name ?? "B"} rotate={2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            {availableLabel}
          </p>
          <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white transition group-hover:bg-brand-hover">
            {cta}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

function PosterThumb({
  src,
  alt,
  rotate = 0,
}: {
  src: string | null
  alt: string
  rotate?: number
}) {
  return (
    <div
      className="w-[72px] overflow-hidden rounded-xl border border-border bg-muted shadow-sm sm:w-[92px]"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className="aspect-[2/3]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-muted" />
        )}
      </div>
    </div>
  )
}

export type UpcomingGame = {
  title: string
  description: string
  icon: ReactNode
}

/** Quiet upcoming list — no greyed-out card tiles. */
export function UpcomingGamesList({
  label,
  items,
}: {
  label: string
  items: UpcomingGame[]
}) {
  return (
    <div className="mt-8">
      <p className="mb-3 mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <ul className="divide-y divide-border/70 border-y border-border/70">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 py-4 sm:items-center sm:gap-4"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/80 text-muted-foreground sm:mt-0">
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground sm:text-base">
                {item.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
