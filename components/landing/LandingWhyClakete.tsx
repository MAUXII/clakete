import Image from "next/image"
import Link from "next/link"
import { ListChecks, MessageSquareText, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const highlights = [
  {
    Icon: MessageSquareText,
    title: "Reviews with personality",
    body: "From a long tweet to a full write-up - share what you felt after the movie.",
  },
  {
    Icon: ListChecks,
    title: "Lists that matter",
    body: "Marathons, favorites, watchlist: organize everything and share it with your followers.",
  },
  {
    Icon: Sparkles,
    title: "Everything connected to the movie",
    body: "Rating, watched, likes, and lists in the same page - less noise, more cinema.",
  },
] as const

export function LandingWhyClakete() {
  return (
    <section
      aria-label="Why Clakete"
      className={cn(
        "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2",
        "bg-black",
        "bg-[radial-gradient(ellipse_90%_60%_at_100%_-10%,rgba(255,0,72,0.14),transparent_52%)]",
        "py-20 sm:py-24 lg:py-28",
      )}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#FF0048]/90">
            Why
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Why Clakete?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Your own space to remember what you watched, share what you thought, and discover your
            next movie - with a diary feel, not a spreadsheet vibe.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {highlights.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 backdrop-blur-sm transition hover:border-[#FF0048]/25"
            >
              <Icon className="h-5 w-5 text-[#FF0048]" strokeWidth={1.75} aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-500 sm:text-sm">{body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="order-2 lg:order-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#FF0048]/90">
              Reviews
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Write. Publish. Connect.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
              Show your take on a movie - and read people who think like you (or differently).
            </p>
            <Link
              href="/sign-in"
              className="mt-6 inline-flex text-sm font-medium text-[#FF0048] transition hover:text-[#ff335f]"
            >
              Start reviewing →
            </Link>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl flex justify-end    bg-black/60 ">
              <Image
                src="/reviews.png"
                alt="Clakete reviews interface"
                width={379}
                height={548}
                className="h-auto  object-contain"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="relative overflow-hidden rounded-2xl  bg-black/60 flex justify-start  ">
            <Image
              src="/lists.png"
              alt="Interface de listas no Clakete"
              width={330}
              height={541}
              className="h-auto object-contain"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#FF0048]/90">
              Lists
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Organize marathons and favorites
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
              Themes, watchlists, rankings: everything visible on your profile for your followers.
            </p>
            <Link
              href="/lists"
              className="mt-6 inline-flex text-sm font-medium text-[#FF0048] transition hover:text-[#ff335f]"
            >
              View lists →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
