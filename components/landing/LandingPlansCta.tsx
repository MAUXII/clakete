import Link from "next/link"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const freeFeatures = [
  "Diary: watched, rating, and dates",
  "Reviews and lists",
  "Public profile",
]

const iluminadoFeatures = [
  "Everything from the Free plan",
  "Visual highlight on your profile",
  "Extra features coming soon",
]

export function LandingPlansCta() {
  return (
    <section
      aria-label="Clakete plans"
      className={cn(
        "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2",
        "border-t border-white/[0.08] bg-[#FF0048]",
        "px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28",
      )}
    >
      <div className="mx-auto max-w-[1152px]">
        <div className="text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/75">
            Plans
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Choose how you want to track your movies
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            The same Clakete - either the classic lightweight way or with{" "}
            <strong className="font-semibold text-white">The Shining</strong> when you want more
            from your account.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:mt-14 md:grid-cols-2 md:gap-8">
          <div
            className={cn(
              "flex flex-col rounded-2xl border border-white/15 bg-black/25 p-8 text-left",
              "backdrop-blur-sm",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/60">
              Plan
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Free</h3>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-white sm:text-4xl">
              $&nbsp;0
              <span className="text-base font-medium text-white/55">/month</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Perfect to start your diary and share it with your followers.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {freeFeatures.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-in"
              className={cn(
                "mt-8 inline-flex w-full items-center justify-center rounded-full border-2 border-white/40 bg-transparent py-3 text-center text-sm font-semibold text-white",
                "transition hover:border-white hover:bg-white/10",
              )}
            >
              Create free account
            </Link>
          </div>

          <div
            className={cn(
              "relative flex flex-col overflow-hidden rounded-2xl border-2 border-white/40 bg-black/40 p-8 text-left",
              "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md",
              "ring-1 ring-inset ring-white/15",
            )}
          >
            <span className="absolute right-5 top-5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FF0048]">
              Paid
            </span>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#ffb3c9]">
              Plan
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              The Shining
            </h3>
            <p className="mt-1 text-sm text-white/75">
              More profile visibility and extra features - an added glow for your movie world.
            </p>
            <p className="mt-4 text-3xl font-semibold tabular-nums text-white sm:text-4xl">
              Coming soon
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {iluminadoFeatures.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-white/95">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ffb3c9]" strokeWidth={2.5} aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <Link
  href="/sign-in"
  aria-disabled="true"
  tabIndex={-1}
  className={cn(
    "mt-8 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-center text-sm font-semibold text-[#FF0048]",
    "opacity-50 pointer-events-none cursor-not-allowed"
  )}
>
              I want The Shining
            </Link>
            <p className="mt-3 text-center text-[11px] text-white/55">
              Billing and checkout come next - for now, join the waitlist through your account.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
