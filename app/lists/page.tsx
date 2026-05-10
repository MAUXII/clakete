"use client"

import { useUser } from "@supabase/auth-helpers-react"
import { UserLists } from "@/components/profile/user-lists"
import { ListCard } from "@/components/lists/list-card"
import { listCardMinHeightClassName } from "@/components/lists/list-card-shell"
import { useEffect, useCallback, useState } from "react"
import { useLists } from "@/hooks/use-lists"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  FilmsCatalogShell,
  FilmsCatalogHeader,
  FilmsScrollToTopFab,
  ListsSubNav,
  type ListsFilter,
} from "@/components/films/films-catalog-shell"
import Link from "next/link"

function ListsSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  )
}

export default function ListsPage() {
  const currentUser = useUser()
  const [listsFilter, setListsFilter] = useState<ListsFilter>("all")
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { lists: publicLists, loading: publicLoading, error: publicError, fetchPublicLists } = useLists()

  useEffect(() => {
    if (!currentUser && listsFilter === "yours") {
      setListsFilter("all")
    }
  }, [currentUser, listsFilter])

  useEffect(() => {
    fetchPublicLists()
  }, [fetchPublicLists])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <FilmsCatalogShell>
      <FilmsCatalogHeader
        eyebrow="Curate"
        title="Lists"
        description="Discover public lists from the community and keep your own picks organized in one place."
      />

      <ListsSubNav
        showYoursTab={!!currentUser}
        value={listsFilter}
        onChange={setListsFilter}
      />

      <div className="flex flex-col gap-16 pb-4">
        {currentUser && listsFilter !== "public" && (
          <section
            id="your-lists"
            className="scroll-mt-28  "
          >
            <ListsSectionHeading
              eyebrow="Profile"
              title="Your lists"
              description="Up to three featured here; everything else stays on your profile."
            />
            <UserLists
              userId={currentUser.id}
              limit={3}
              alwaysShowThree
              gridCols={3}
              gridColumns={3}
              compactCards={false}
              hideSectionHeading
            />
          </section>
        )}

        {listsFilter !== "yours" && (
        <section id="public-lists" className="scroll-mt-28">
          <ListsSectionHeading
            eyebrow="Community"
            title="Public lists"
            description="Recently updated lists from people on Clakete."
          />

          {publicLoading ? (
            <div className="grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-sm shadow-black/20",
                    listCardMinHeightClassName,
                  )}
                >
                  <div className="relative h-[8.75rem] shrink-0 sm:h-[10.25rem] lg:h-[11.25rem]">
                    <div className="absolute inset-0 overflow-hidden rounded-t-2xl">
                      <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/[0.06]" />
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 sm:px-4">
                      <div className="absolute bottom-0 left-1/2 flex w-max -translate-x-1/2 translate-y-[26%] items-end justify-center sm:translate-y-[24%] lg:translate-y-[22%]">
                        {Array.from({ length: 5 }).map((__, j) => {
                          const lift = Math.round(Math.abs(j - 2) ** 2 * 0.65)
                          return (
                            <Skeleton
                              key={j}
                              className={cn(
                                "aspect-[2/3] w-[3.95rem] shrink-0 rounded-xl bg-white/[0.08] sm:w-[4.55rem] lg:w-[5.25rem]",
                                j > 0 && "-ml-[1.18rem] sm:-ml-[1.38rem] lg:-ml-[1.58rem]",
                              )}
                              style={{ zIndex: j + 1, transform: `translateY(-${lift}px)` }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col space-y-3 px-5 pb-5 pt-[4rem] sm:pt-[4.25rem] lg:pt-[4.85rem]">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-4/5 bg-white/[0.08]" />
                      <Skeleton className="h-3.5 w-full bg-white/[0.06]" />
                      <Skeleton className="h-3.5 w-[90%] bg-white/[0.06]" />
                    </div>
                    <div className="mt-auto flex gap-2 border-t border-white/[0.06] pt-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/[0.08]" />
                      <div className="flex-1 space-y-1.5 pt-0.5">
                        <Skeleton className="h-2.5 w-16 bg-white/[0.06]" />
                        <Skeleton className="h-4 w-24 bg-white/[0.08]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : publicError ? (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] py-12 text-center">
              <p className="text-sm text-zinc-400">Could not load lists: {publicError}</p>
            </div>
          ) : publicLists.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] py-14 text-center">
              <p className="text-sm text-zinc-400">No public lists yet.</p>
              {currentUser ? (
                <p className="mt-2 text-xs text-zinc-500">
                  Create a list and set it to public to show up here.
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">
                  <Link href="/sign-in" className="text-[#FF0048] underline-offset-4 hover:underline">
                    Sign in
                  </Link>{" "}
                  to create yours.
                </p>
              )}
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
              {publicLists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  className="h-full min-h-0 border-white/[0.08] bg-white/[0.02] shadow-black/20 hover:border-[#FF0048]/25 hover:shadow-[#FF0048]/10"
                />
              ))}
            </div>
          )}
        </section>
        )}
      </div>

      <FilmsScrollToTopFab visible={showScrollTop} onClick={scrollToTop} />
    </FilmsCatalogShell>
  )
}
