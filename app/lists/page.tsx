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
import { useDesignMode } from "@/hooks/use-design-mode"
import Link from "next/link"

function ListsSectionHeading({
  eyebrow,
  title,
  description,
  isGlass,
}: {
  eyebrow: string
  title: string
  description: string
  isGlass?: boolean
}) {
  return (
    <div className="mb-6 space-y-2">
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.22em]",
          isGlass ? "text-white/40" : "text-muted-foreground",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "text-xl font-semibold tracking-tight sm:text-2xl",
          isGlass ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "max-w-2xl text-sm leading-relaxed",
          isGlass ? "text-white/45" : "text-muted-foreground",
        )}
      >
        {description}
      </p>
    </div>
  )
}

export default function ListsPage() {
  const currentUser = useUser()
  const isGlass = useDesignMode() === "glass"
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

  const gridClass = isGlass
    ? "grid w-full grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6"
    : "grid w-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8"

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
          <section id="your-lists" className="scroll-mt-28">
            <ListsSectionHeading
              isGlass={isGlass}
              eyebrow="Profile"
              title="Your lists"
              description="Up to three featured here; everything else stays on your profile."
            />
            <UserLists
              userId={currentUser.id}
              limit={3}
              alwaysShowThree
              gridCols={isGlass ? 2 : 3}
              gridColumns={isGlass ? 2 : 3}
              compactCards={false}
              hideSectionHeading
            />
          </section>
        )}

        {listsFilter !== "yours" && (
          <section id="public-lists" className="scroll-mt-28">
            <ListsSectionHeading
              isGlass={isGlass}
              eyebrow="Community"
              title="Public lists"
              description="Recently updated lists from people on Clakete."
            />

            {publicLoading ? (
              <div className={gridClass}>
                {Array.from({ length: isGlass ? 6 : 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex h-full min-h-0 flex-col overflow-hidden",
                      isGlass
                        ? "rounded-[18px] bg-white/[0.035] ring-1 ring-white/[0.08]"
                        : cn(
                            "rounded-2xl border border-border bg-muted/30",
                            listCardMinHeightClassName,
                          ),
                    )}
                  >
                    <div className="relative h-[7.5rem] shrink-0 sm:h-[8.5rem]">
                      <Skeleton
                        className={cn(
                          "absolute inset-0 h-full w-full rounded-none",
                          isGlass ? "bg-white/[0.06]" : "bg-muted/60",
                        )}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-12">
                      <Skeleton className={cn("h-5 w-4/5", isGlass ? "bg-white/[0.08]" : "bg-muted")} />
                      <Skeleton className={cn("h-3.5 w-full", isGlass ? "bg-white/[0.05]" : "bg-muted/60")} />
                      <Skeleton className={cn("mt-auto h-8 w-32", isGlass ? "bg-white/[0.06]" : "bg-muted/60")} />
                    </div>
                  </div>
                ))}
              </div>
            ) : publicError ? (
              <div
                className={cn(
                  "py-12 text-center",
                  isGlass
                    ? "rounded-[18px] bg-white/[0.03] ring-1 ring-white/[0.08]"
                    : "rounded-xl border border-border bg-muted/40",
                )}
              >
                <p className={cn("text-sm", isGlass ? "text-white/45" : "text-muted-foreground")}>
                  Could not load lists: {publicError}
                </p>
              </div>
            ) : publicLists.length === 0 ? (
              <div
                className={cn(
                  "py-14 text-center",
                  isGlass
                    ? "rounded-[18px] border border-dashed border-white/15 bg-white/[0.02]"
                    : "rounded-xl border border-dashed border-border bg-muted/30",
                )}
              >
                <p className={cn("text-sm", isGlass ? "text-white/45" : "text-muted-foreground")}>
                  No public lists yet.
                </p>
                {currentUser ? (
                  <p className={cn("mt-2 text-xs", isGlass ? "text-white/35" : "text-muted-foreground")}>
                    Create a list and set it to public to show up here.
                  </p>
                ) : (
                  <p className={cn("mt-3 text-sm", isGlass ? "text-white/45" : "text-muted-foreground")}>
                    <Link
                      href="/sign-in"
                      className={cn(
                        "underline-offset-4 hover:underline",
                        isGlass ? "text-white" : "text-brand",
                      )}
                    >
                      Sign in
                    </Link>{" "}
                    to create yours.
                  </p>
                )}
              </div>
            ) : (
              <div className={gridClass}>
                {publicLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    className={
                      isGlass
                        ? "h-full min-h-0"
                        : "h-full min-h-0 border border-border bg-muted/30 shadow-none hover:border-border hover:shadow-none"
                    }
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
