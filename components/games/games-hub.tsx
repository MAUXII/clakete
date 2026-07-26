"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpDown,
  Image as ImageIcon,
  Quote,
  Sparkles,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FeaturedGame, UpcomingGamesList } from "@/components/games/game-hub-card"
import { useT } from "@/components/providers/i18n-provider"
import { pickRandomSeeds, tmdbPosterUrl } from "@/lib/games/connect-the-stars"
import { pageContainerClass } from "@/lib/page-container"
import { cn } from "@/lib/utils"

type Face = { id: number; name: string; imagePath: string | null }

function DotField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.11) 1px, transparent 1.2px)`,
        backgroundSize: "20px 20px",
      }}
    />
  )
}

function SketchFrame({
  children,
  className,
  rotate = 0,
}: {
  children: ReactNode
  className?: string
  rotate?: number
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </div>
  )
}

function ConnectDiagram({
  faces,
  pathCaption,
}: {
  faces: Face[]
  pathCaption: string
}) {
  const a = faces[0]
  const b = faces[1]
  const aSrc = a ? tmdbPosterUrl(a.imagePath, "w185") : null
  const bSrc = b ? tmdbPosterUrl(b.imagePath, "w185") : null

  return (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 sm:p-5">
      <DotField className="opacity-70" />
      <div className="relative z-[1] flex items-center justify-center gap-2 sm:gap-4">
        <SketchFrame className="w-[72px] sm:w-[88px]" rotate={-2}>
          <div className="aspect-[2/3] bg-muted">
            {aSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={aSrc} alt={a?.name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                A
              </div>
            )}
          </div>
        </SketchFrame>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1">
          <svg
            viewBox="0 0 120 24"
            className="h-6 w-full max-w-[140px] text-brand/70"
            aria-hidden
          >
            <path
              d="M4 14 C 30 4, 50 20, 70 10 S 100 6, 116 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs text-muted-foreground sm:text-sm">
            {pathCaption}
          </span>
        </div>

        <SketchFrame className="w-[72px] sm:w-[88px]" rotate={2.5}>
          <div className="aspect-[2/3] bg-muted">
            {bSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bSrc} alt={b?.name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-lg text-muted-foreground">
                B
              </div>
            )}
          </div>
        </SketchFrame>
      </div>
    </div>
  )
}

function FrameGuessVisual() {
  return (
    <div className="relative my-4 overflow-hidden rounded-2xl border border-border bg-muted/30">
      <div className="aspect-[16/9] w-full bg-gradient-to-br from-muted via-background to-muted">
        <div className="absolute inset-0 opacity-40">
          <DotField />
        </div>
        <div className="absolute inset-6 rounded-lg border-2 border-dashed border-border/70 sm:inset-8" />
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-muted-foreground sm:text-2xl">
          ???
        </p>
        <span className="absolute bottom-3 right-3 rounded-md border border-border bg-background/80 px-2 py-0.5 text-xs text-muted-foreground backdrop-blur">
          frame
        </span>
      </div>
    </div>
  )
}

function HigherLowerVisual() {
  return (
    <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <SketchFrame className="overflow-hidden" rotate={-1.5}>
        <div className="flex aspect-[2/3] items-end bg-gradient-to-t from-brand/25 to-muted p-2">
          <span className="text-sm text-foreground">Film A</span>
        </div>
      </SketchFrame>
      <div className="flex flex-col items-center gap-1">
        <ArrowUpDown className="h-5 w-5 text-brand" />
        <span className="text-xs text-muted-foreground">vs</span>
      </div>
      <SketchFrame className="overflow-hidden" rotate={1.5}>
        <div className="flex aspect-[2/3] items-end bg-gradient-to-t from-muted-foreground/20 to-muted p-2">
          <span className="text-sm text-foreground">Film B</span>
        </div>
      </SketchFrame>
    </div>
  )
}

function QuoteVisual() {
  return (
    <div className="relative my-4 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
      <Quote className="mx-auto mb-2 h-5 w-5 text-brand/70" />
      <p className="text-lg leading-snug text-foreground sm:text-xl">
        “I&apos;ll be back.”
      </p>
      <p className="mt-3 text-xs text-muted-foreground">filme?</p>
    </div>
  )
}

export function GamesHub() {
  const { t } = useT()
  const [heroFaces, setHeroFaces] = useState<Face[]>([])
  const [featuredFaces, setFeaturedFaces] = useState<Face[]>([])
  const [guideFaces, setGuideFaces] = useState<Face[]>([])

  useEffect(() => {
    // 4 unique famous actors: strip + featured pair + guide pair (pairs don't match)
    const seeds = pickRandomSeeds(4)
    let cancelled = false

    void (async () => {
      const loaded = await Promise.all(
        seeds.map(async (s) => {
          try {
            const res = await fetch(`/api/games/person/${s.id}`)
            if (!res.ok) throw new Error("fail")
            const data = (await res.json()) as {
              id: number
              name: string
              imagePath: string | null
            }
            return {
              id: data.id,
              name: data.name,
              imagePath: data.imagePath,
            } satisfies Face
          } catch {
            return { id: s.id, name: s.name, imagePath: null } satisfies Face
          }
        }),
      )
      if (cancelled) return
      setHeroFaces(loaded)
      setFeaturedFaces(loaded.slice(0, 2))
      setGuideFaces(loaded.slice(2, 4))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="relative min-h-[70dvh] overflow-hidden">
      <DotField className="opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-40 h-56 w-56 rounded-full bg-muted-foreground/10 blur-3xl"
      />

      <div className={cn(pageContainerClass, "relative z-[1] mt-28 pb-16 sm:pb-20")}>
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Clakete
          </p>
          <h1 className="mt-3 font-sketch text-5xl leading-none tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {t("games.hubTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("games.hubIntro")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("games.hubIntroMore")}
          </p>

          {/* Floating face strip */}
          <div className="mx-auto mt-8 flex max-w-lg items-end justify-center gap-2 sm:gap-3">
            {(heroFaces.length ? heroFaces : [null, null, null, null]).map((f, i) => {
              const src = f ? tmdbPosterUrl(f.imagePath, "w185") : null
              const rot = [-3, 2, -1.5, 3][i] ?? 0
              return (
                <SketchFrame
                  key={f?.id ?? i}
                  className={cn(
                    "w-[18%] max-w-[88px] overflow-hidden",
                    i % 2 === 0 ? "translate-y-1" : "-translate-y-2",
                  )}
                  rotate={rot}
                >
                  <div className="aspect-[2/3] bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={f?.name ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-muted" />
                    )}
                  </div>
                </SketchFrame>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("games.hubFacesCaption")}
          </p>
        </header>

        {/* Play grid */}
        <section className="mt-14 sm:mt-16">
          <div className="mb-6 max-w-xl">
            <h2 className="font-sketch text-3xl leading-tight text-foreground sm:text-4xl">
              {t("games.hubPlaySection")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("games.hubPlaySectionDesc")}
            </p>
          </div>

          <div className="space-y-0">
            <FeaturedGame
              title={t("games.connectTitle")}
              description={t("games.connectDesc")}
              href="/games/connect-the-stars"
              cta={t("games.playNow")}
              availableLabel={t("games.hubAvailable")}
              pathCaption={t("games.hubConnectPathCaption")}
              faces={featuredFaces.map((f) => ({
                name: f.name,
                src: tmdbPosterUrl(f.imagePath, "w185"),
              }))}
            />
            <UpcomingGamesList
              label={t("games.comingSoon")}
              items={[
                {
                  title: t("games.frameTitle"),
                  description: t("games.frameDesc"),
                  icon: <ImageIcon className="h-4 w-4" />,
                },
                {
                  title: t("games.higherTitle"),
                  description: t("games.higherDesc"),
                  icon: <ArrowUpDown className="h-4 w-4" />,
                },
                {
                  title: t("games.quoteTitle"),
                  description: t("games.quoteDesc"),
                  icon: <Quote className="h-4 w-4" />,
                },
              ]}
            />
          </div>
        </section>

        {/* Accordion guides */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-6 max-w-2xl">
            <h2 className="font-sketch text-3xl leading-tight text-foreground sm:text-4xl">
              {t("games.hubGuideTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("games.hubGuideSubtitle")}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur-sm">
            <Accordion type="single" collapsible defaultValue="connect" className="px-4 sm:px-5">
              <AccordionItem value="connect">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand" />
                    <span className="text-sm font-semibold sm:text-base">
                      {t("games.connectTitle")}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p className="text-sm leading-relaxed text-foreground">
                    {t("games.connectGuideLead")}
                  </p>
                  <ConnectDiagram
                    faces={guideFaces}
                    pathCaption={t("games.hubConnectPathCaption")}
                  />
                  <p className="text-sm leading-relaxed">
                    {t("games.connectGuideBody")}
                  </p>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
                    <li>{t("games.connectGuideStep1")}</li>
                    <li>{t("games.connectGuideStep2")}</li>
                    <li>{t("games.connectGuideStep3")}</li>
                  </ol>
                  <p className="rounded-xl border border-brand/25 bg-brand/5 px-3 py-2 text-sm text-foreground">
                    {t("games.connectGuideTip")}
                  </p>
                  <Link
                    href="/games/connect-the-stars"
                    className="inline-flex items-center rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-hover"
                  >
                    {t("games.playNow")}
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="frame">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold sm:text-base">
                      {t("games.frameTitle")}
                    </span>
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("games.comingSoon")}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p className="text-sm leading-relaxed text-foreground">
                    {t("games.frameGuideLead")}
                  </p>
                  <FrameGuessVisual />
                  <p className="text-sm leading-relaxed">
                    {t("games.frameGuideBody")}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="higher">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold sm:text-base">
                      {t("games.higherTitle")}
                    </span>
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("games.comingSoon")}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p className="text-sm leading-relaxed text-foreground">
                    {t("games.higherGuideLead")}
                  </p>
                  <HigherLowerVisual />
                  <p className="text-sm leading-relaxed">
                    {t("games.higherGuideBody")}
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="quote">
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    <Quote className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold sm:text-base">
                      {t("games.quoteTitle")}
                    </span>
                    <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("games.comingSoon")}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-muted-foreground">
                  <p className="text-sm leading-relaxed text-foreground">
                    {t("games.quoteGuideLead")}
                  </p>
                  <QuoteVisual />
                  <p className="text-sm leading-relaxed">
                    {t("games.quoteGuideBody")}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  )
}
