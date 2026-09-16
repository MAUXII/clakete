'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { FaGithub, FaInstagram, FaLinkedin, FaXTwitter } from "react-icons/fa6"
import { TextRoll } from "@/components/ui/skiper-ui/skiper58"

/** High-res TMDB stills (Fight Club + The Shining). */
const FOOTER_BACKDROPS = [
  // Fight Club
  "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
  "https://image.tmdb.org/t/p/original/c6OLXfKAk5BKeR6broC8pYiCquX.jpg",
  "https://image.tmdb.org/t/p/original/xRyINp9KfMLVjRiO5nCsoRDdvvF.jpg",
  "https://image.tmdb.org/t/p/original/8iVyhmjzUbvAGppkdCZPiyEHSoF.jpg",
  "https://image.tmdb.org/t/p/original/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
  // The Shining
  "https://image.tmdb.org/t/p/original/mmd1HnuvAzFc4iuVJcnBrhDNEKr.jpg",
  "https://image.tmdb.org/t/p/original/x1vmewr9K7sXOvwhntlUoorf12k.jpg",
  "https://image.tmdb.org/t/p/original/AdKA2F1SzYPhSZdEbjH1Zh75UVQ.jpg",
  "https://image.tmdb.org/t/p/original/lEqwBnJxiLFbjadBcDi2B2FrsDF.jpg",
  "https://image.tmdb.org/t/p/original/s3eCRJfdCSva3Vi3KzGCSD8ZW77.jpg",
] as const

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/films/discover", label: "Filmes" },
  { href: "/series/discover", label: "Séries" },
  { href: "/lists", label: "Listas" },
  { href: "/games", label: "Games" },
  { href: "/account/billing", label: "The Shining" },
] as const

const INFO_ROWS = [
  { key: "A", value: "Film data from TMDB" },
  { key: "E", value: "hello@clakete.xyz" },
  { key: "P", href: "/privacy", value: "Privacy Policy" },
  { key: "T", href: "/terms", value: "Terms of Service" },
] as const

export default function Footer() {
  const year = new Date().getFullYear()
  const [backdropSrc, setBackdropSrc] = useState<string>(FOOTER_BACKDROPS[0]!)

  useEffect(() => {
    const i = Math.floor(Math.random() * FOOTER_BACKDROPS.length)
    setBackdropSrc(FOOTER_BACKDROPS[i]!)
  }, [])

  const labelClass = "text-[11px] font-medium uppercase tracking-[0.14em] text-white/40"

  return (
    <footer className="relative isolate z-10 w-full overflow-hidden bg-[#151618] text-white">
      <div className="relative grid min-h-[calc(100dvh-var(--ck-nav-h,3.25rem)-var(--clakete-promo-h,0px))] w-full grid-cols-1 gap-14 px-6 py-10 sm:px-8 sm:py-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-12 md:px-10 md:py-12 lg:gap-16 lg:px-14 xl:px-16">
        {/* Left — still + LED clipped to the footer (won't paint over page content) */}
        <div className="relative flex min-h-0 flex-col md:h-full">
          <div className="relative aspect-[3/4] w-full max-w-[280px] sm:max-w-[320px] md:max-w-none md:h-full md:min-h-[420px] md:flex-1 md:aspect-auto">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-[22%] -bottom-[18%] -top-[12%] z-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backdropSrc}
                alt=""
                className="h-full w-full scale-110 object-cover opacity-70 blur-[64px] saturate-150"
              />
            </div>

            <div className="relative z-10 h-full w-full overflow-hidden bg-black/50">
              <Image
                src={backdropSrc}
                alt=""
                fill
                sizes="(max-width: 768px) 90vw, 36vw"
                quality={95}
                className="object-cover object-center"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* Center — navigation */}
        <nav aria-label="Rodapé" className="relative z-10 flex flex-col gap-8 md:h-full">
          <p className={labelClass}>(navigation)</p>
          <ul className="flex flex-col gap-1.5 sm:gap-2">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block leading-none text-white"
                  style={{ fontFamily: "FilmeSans, sans-serif" }}
                >
                  <TextRoll className="text-[clamp(1.75rem,3.2vw,2.75rem)] font-semibold tracking-[-0.04em]">
                    {item.label}
                  </TextRoll>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right — acknowledgement + info + meta */}
        <div className="relative z-10 flex flex-col gap-10 md:h-full">
          <div className="flex flex-col gap-10">
            <div className="space-y-3">
              <p className={labelClass}>(acknowledgement)</p>
              <p className="max-w-[28rem] text-[13px] leading-relaxed text-white/55 sm:text-sm">
                Clakete é o lugar pra registrar o que você assiste, montar listas e
                acompanhar amigos — filmes e séries, no seu ritmo.
              </p>
            </div>

            <div className="space-y-3">
              <p className={labelClass}>(info)</p>
              <ul className="space-y-2">
                {INFO_ROWS.map((row) => (
                  <li
                    key={row.key}
                    className="grid grid-cols-[1.5rem_1fr] gap-2 text-[13px] text-white/55 sm:text-sm"
                  >
                    <span className="font-medium text-white/80">{row.key}:</span>
                    {"href" in row && row.href ? (
                      <Link
                        href={row.href}
                        className="underline-offset-2 transition hover:underline"
                      >
                        {row.value}
                      </Link>
                    ) : row.key === "A" ? (
                      <span>
                        Film data from{" "}
                        <a
                          href="https://www.themoviedb.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-2 hover:underline"
                        >
                          The Movie Database
                        </a>
                      </span>
                    ) : (
                      <span>{row.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
            <p className="text-xs text-white/35">© {year} Clakete</p>
            <div className="flex items-center gap-3 text-white/45">
              <a href="https://github.com" aria-label="GitHub" className="transition hover:opacity-70">
                <FaGithub className="size-4" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn" className="transition hover:opacity-70">
                <FaLinkedin className="size-4" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="transition hover:opacity-70">
                <FaInstagram className="size-4" />
              </a>
              <a href="https://x.com" aria-label="X" className="transition hover:opacity-70">
                <FaXTwitter className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
