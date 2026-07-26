import Image from "next/image"
import Link from "next/link"
import { ClaketeLogo } from "@/components/ui/clakete-logo"
import { HideAppChrome } from "@/components/ui/hide-app-footer"

/**
 * 404 backdrops — mostly The Shining + Fight Club (TMDB textless backdrops).
 * Weighted pool: more entries = more chance on each load.
 */
const NOT_FOUND_BACKDROPS = [
  // —— Fight Club (550)
  {
    src: "https://image.tmdb.org/t/p/w1920/c6OLXfKAk5BKeR6broC8pYiCquX.jpg",
    line: "Eu sou a página que falta do Jack.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
    line: "A primeira regra do 404: você não fala sobre o 404.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/xRyINp9KfMLVjRiO5nCsoRDdvvF.jpg",
    line: "Essa página se autodissolveu.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/52AfXWuXCHn3UjD17rBruA9f5qb.jpg",
    line: "Você não é a sua URL.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
    line: "Perdemos o endereço. De propósito.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/3nv2TEz2u178xPXzdKlZdUh5uOI.jpg",
    line: "Hit me, 404.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/8iVyhmjzUbvAGppkdCZPiyEHSoF.jpg",
    line: "Essa página nunca existiu. Ou existiu demais.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/mD7Q7NynkKKdbhXxcbk3OjY7GM7.jpg",
    line: "Bem-vindo ao andar de baixo da internet.",
  },

  // —— The Shining (694) — majority weight: duplicated odds via more entries
  {
    src: "https://image.tmdb.org/t/p/w1920/mmd1HnuvAzFc4iuVJcnBrhDNEKr.jpg",
    line: "REDRUM.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/AdKA2F1SzYPhSZdEbjH1Zh75UVQ.jpg",
    line: "Here's Johnny! …mas a página não.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/x1vmewr9K7sXOvwhntlUoorf12k.jpg",
    line: "All work and no play makes 404.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/dQMjySqD3rC8hSueCw3inXRJmIU.jpg",
    line: "O Overlook engoliu essa página.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/hWbC1ix65Ln7GySSvt6oe31A9GY.jpg",
    line: "Come play with us… nessa URL que não existe.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/lEqwBnJxiLFbjadBcDi2B2FrsDF.jpg",
    line: "O labirinto não tem saída. Nem essa página.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/bnwCKp6Zi2S6qMMevXUHkjPORZZ.jpg",
    line: "Room 237 está fora do ar.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/uwP1nM9luk8tl7IcIlXTnwYrcqI.jpg",
    line: "O inverno chegou. A página, não.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/32b4iRNlLw6t5dVhDps9ugN5qhz.jpg",
    line: "Tony não sabe onde fica essa página.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/s3eCRJfdCSva3Vi3KzGCSD8ZW77.jpg",
    line: "Aqui o tempo não passa — e o link também não.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/ntRt1eZkfN7YRPtuSCUYkWxXHzk.jpg",
    line: "REDRUM. REDRUM. 404.",
  },
  {
    src: "https://image.tmdb.org/t/p/w1920/d9Y9UuCLPBT0KrZR7yvEFvZcHG5.jpg",
    line: "Você sempre esteve no Overlook.",
  },
] as const

function pickBackdrop() {
  return NOT_FOUND_BACKDROPS[
    Math.floor(Math.random() * NOT_FOUND_BACKDROPS.length)
  ]!
}

type NotFoundScreenProps = {
  /** Sketch headline (Letterboxd-style apology) */
  message?: string
  /** Quieter supporting line under the headline */
  detail?: string
  href?: string
  /** @deprecated Logo links home; kept for call-site compat */
  linkLabel?: string
}

const DEFAULT_MESSAGE = "Desculpa, não encontramos a página que você pediu."
const DEFAULT_DETAIL = "Se o problema continuar, entre em contato conosco:"
const SUPPORT_EMAIL = "hello@clakete.xyz"

export function NotFoundScreen({
  message = DEFAULT_MESSAGE,
  detail = DEFAULT_DETAIL,
  href = "/",
}: NotFoundScreenProps) {
  const backdrop = pickBackdrop()

  return (
    <div className="relative isolate flex min-h-dvh w-full flex-col justify-end overflow-hidden bg-black">
      {/* Parsed before fixed chrome siblings — prevents navbar flash on reload. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-hide-chrome','1');`,
        }}
      />
      <HideAppChrome />
      <Image
        src={backdrop.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent"
      />

      {/* Film-credit style — bottom left, logo is the way home */}
      <div className="relative z-10 w-full max-w-2xl px-6 pb-10 pt-24 sm:px-10 sm:pb-14 md:px-14 md:pb-16">
        <Link
          href={href}
          className="inline-flex transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          aria-label="Clakete — voltar ao início"
        >
          <ClaketeLogo className="h-10 w-10 sm:h-11 sm:w-11" title="Clakete" />
        </Link>
        <h1 className="font-sketch mt-5 max-w-xl text-3xl leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-4xl md:text-5xl">
          {message}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60 sm:text-[15px]">
        {backdrop.line} {detail}{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-white/80 underline decoration-white/30 underline-offset-2 transition hover:text-white hover:decoration-white/60"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>

      </div>
    </div>
  )
}
