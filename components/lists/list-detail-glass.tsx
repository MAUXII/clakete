"use client"

import Link from "next/link"
import {
  Clock3,
  Copy,
  GripVertical,
  Heart,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  Plus,
  Share2,
} from "lucide-react"
import { IoTrashOutline } from "react-icons/io5"
import { rectSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { motion } from "framer-motion"
import { MediaAtmosphere } from "@/components/media/media-atmosphere"
import { MovieCard } from "@/components/movies/movie-card"
import { SeriesCard } from "@/components/series/series-card"
import { Button } from "@/components/ui/button"
import { Sortable, SortableContent, SortableItem, SortableOverlay } from "@/components/ui/sortable"
import { glassProfileContainerClass } from "@/lib/page-container"
import { listBannerPresentation } from "@/lib/list-banner"
import { userProfilePath } from "@/lib/list-href"
import { filmHref, seriesHref } from "@/lib/media-href"
import { cn } from "@/lib/utils"
import type { ListDetailGlassProps } from "@/components/lists/list-detail-types"
import {
  LIST_REORDER_POSTER_GRID,
  LIST_REORDER_POSTER_LIST,
  ListReorderDragPreview,
  REORDER_SHELL_DURATION_S,
  REORDER_SHELL_EASE,
} from "@/components/lists/list-reorder-bits"

const toolBtnClass =
  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"

export function ListDetailGlass({
  list,
  films,
  setFilms,
  canEdit,
  currentUserId,
  likeCount,
  userLiked,
  likePending,
  watchedInList,
  totalListItems,
  progressPercent,
  listTags,
  viewMode,
  setViewMode,
  reorderMode,
  reorderLeaving,
  reorderSaving,
  reorderShellExpanded,
  reorderShellBorder,
  listReorderDragBox,
  onReorderDragStart,
  onEnterReorder,
  onCancelReorder,
  onConfirmReorder,
  onRemoveFilm,
  onOpenSearch,
  onOpenEditList,
  onOpenBannerEdit,
  onToggleLike,
}: ListDetailGlassProps) {
  const bannerPres = listBannerPresentation(list)
  const bannerSrc = bannerPres.src
  const firstPoster = films.find((f) => f.poster_path?.trim())?.poster_path
  const atmosphereUrl =
    bannerSrc ||
    (firstPoster ? `https://image.tmdb.org/t/p/w780${firstPoster}` : null)

  const username = list.userData?.username || "user"

  return (
    <>
      <MediaAtmosphere coverUrl={atmosphereUrl} seed={list.id} />

      <div
        className={cn(
          "relative z-[1] min-h-screen bg-transparent",
          glassProfileContainerClass,
          "mt-[calc(var(--ck-nav-h,3.25rem)+var(--clakete-promo-h,0px))] pb-24 pt-6 md:pt-10",
        )}
      >
        <article className="w-full space-y-8">
          {/* Header — kept; this was the part that worked */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={userProfilePath(list.userData?.username)}
              className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
            >
              <span className="text-white/35">List by</span>
              <span className="font-medium text-white">@{username}</span>
            </Link>

            <div className="inline-flex flex-wrap items-center justify-end gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/45 ring-1 ring-white/10">
                <Clock3 className="h-3 w-3" />
                Updated {new Date(list.updated_at).toLocaleDateString("en-US")}
              </span>
              <div
                className={cn(
                  "inline-flex items-center rounded-full bg-white/[0.05] p-1 ring-1 ring-white/10",
                  reorderMode && "pointer-events-none opacity-50",
                )}
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  title="Grid"
                  disabled={reorderMode}
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:bg-white/10 hover:text-white/80",
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  title="List"
                  disabled={reorderMode}
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    viewMode === "list"
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:bg-white/10 hover:text-white/80",
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Title + bio */}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {list.title}
            </h1>
            {list.bio ? (
              <p className="max-w-2xl text-[15px] leading-relaxed text-white/55 md:text-base">
                {list.bio}
              </p>
            ) : null}
          </div>

          {/* Actions — compact toolbar instead of fake poster column */}
          <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.08] pb-4">
            <button
              type="button"
              disabled={likePending}
              onClick={onToggleLike}
              className={cn(
                toolBtnClass,
                userLiked && "text-brand hover:text-brand",
              )}
            >
              <Heart
                className={cn("h-3.5 w-3.5", userLiked && "fill-brand text-brand")}
              />
              {userLiked ? "Liked" : "Like"}
              <span className="tabular-nums text-white/35">{likeCount}</span>
            </button>
            <button type="button" className={toolBtnClass}>
              <Copy className="h-3.5 w-3.5" />
              Clone
            </button>
            <button type="button" className={toolBtnClass}>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            {canEdit ? (
              <>
                <button type="button" onClick={onOpenEditList} className={toolBtnClass}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button type="button" onClick={onOpenBannerEdit} className={toolBtnClass}>
                  Banner
                </button>
                {films.length > 0 ? (
                  reorderMode && !reorderLeaving ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-1 h-8 rounded-full border-white/15 bg-transparent px-3 text-xs text-white/80 hover:bg-white/10"
                        onClick={onCancelReorder}
                        disabled={reorderSaving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 rounded-full bg-white px-3 text-xs text-black hover:bg-white/92"
                        onClick={() => void onConfirmReorder()}
                        disabled={reorderSaving}
                      >
                        Done
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={onEnterReorder}
                      disabled={reorderMode}
                      className={toolBtnClass}
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                      Reorder
                    </button>
                  )
                ) : null}
              </>
            ) : null}

            <div className="ml-auto flex min-w-0 items-center gap-3 pl-2">
              <span className="hidden text-[11px] tabular-nums text-white/40 sm:inline">
                {watchedInList}/{totalListItems} watched
                {currentUserId ? ` · ${progressPercent}%` : ""}
              </span>
              <div className="h-1 w-20 overflow-hidden rounded-full bg-white/[0.08] sm:w-28">
                <div
                  className="h-full rounded-full bg-white/50 transition-[width] duration-300"
                  style={{
                    width: totalListItems === 0 ? "0%" : `${progressPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {listTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {listTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2.5 py-1 text-[11px] text-white/45 ring-1 ring-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Films */}
          <section>
            {films.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-white/45">No films in this list yet.</p>
                {canEdit ? (
                  <Button
                    onClick={onOpenSearch}
                    className="mt-5 border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add films
                  </Button>
                ) : null}
              </div>
            ) : reorderMode && canEdit ? (
              <motion.div
                key="list-reorder-shell-glass"
                className="overflow-visible rounded-xl"
                animate={{
                  padding: reorderShellExpanded ? 16 : 0,
                  borderWidth: reorderShellBorder ? 1 : 0,
                }}
                transition={{
                  padding: {
                    type: "tween",
                    duration: REORDER_SHELL_DURATION_S,
                    ease: REORDER_SHELL_EASE,
                  },
                  borderWidth: reorderShellBorder
                    ? {
                        type: "tween",
                        duration: REORDER_SHELL_DURATION_S,
                        ease: REORDER_SHELL_EASE,
                      }
                    : { type: "tween", duration: 0 },
                }}
                style={{
                  borderStyle: "dashed",
                  borderColor: "rgba(255, 255, 255, 0.14)",
                  boxSizing: "border-box",
                }}
              >
                <Sortable
                  value={films}
                  onValueChange={setFilms}
                  getItemValue={(f) => f.id}
                  orientation={viewMode === "list" ? "vertical" : "mixed"}
                  modifiers={[]}
                  onDragStart={onReorderDragStart}
                >
                  <SortableContent
                    asChild
                    strategy={
                      viewMode === "list"
                        ? verticalListSortingStrategy
                        : rectSortingStrategy
                    }
                  >
                    <ul
                      className={cn(
                        "m-0 w-full list-none p-0",
                        viewMode === "list"
                          ? "flex flex-col gap-1"
                          : "ck-catalog-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5",
                      )}
                    >
                      {films.map((film, idx) =>
                        viewMode === "list" ? (
                          <SortableItem
                            key={film.id}
                            value={film.id}
                            asChild
                            asHandle
                            className="data-[dragging]:bg-white/10"
                          >
                            <li className="flex touch-none list-none select-none items-center gap-4 rounded-lg px-1 py-2">
                              <span className="w-5 text-center text-xs tabular-nums text-white/30">
                                {idx + 1}
                              </span>
                              <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
                                {film.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/${LIST_REORDER_POSTER_LIST}${film.poster_path}`}
                                    alt={film.title}
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-white/10 text-[10px] text-white/40">
                                    ?
                                  </div>
                                )}
                              </div>
                              <span className="truncate text-sm text-white/80">{film.title}</span>
                            </li>
                          </SortableItem>
                        ) : (
                          <SortableItem
                            key={film.id}
                            value={film.id}
                            asChild
                            asHandle
                            className="data-[dragging]:bg-white/10"
                          >
                            <li className="relative aspect-[2/3] w-full min-w-0 touch-none list-none select-none">
                              <div className="relative h-full w-full overflow-hidden rounded-[10px]">
                                {film.poster_path ? (
                                  <img
                                    src={`https://image.tmdb.org/t/p/${LIST_REORDER_POSTER_GRID}${film.poster_path}`}
                                    alt={film.title}
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm text-white/40">
                                    ?
                                  </div>
                                )}
                              </div>
                            </li>
                          </SortableItem>
                        ),
                      )}
                    </ul>
                  </SortableContent>
                  <SortableOverlay className="shadow-none ring-0">
                    {({ value }) => {
                      const f = films.find((x) => x.id === value)
                      if (!f) return null
                      return (
                        <ListReorderDragPreview
                          film={f}
                          box={listReorderDragBox}
                          posterProfile={
                            viewMode === "list"
                              ? LIST_REORDER_POSTER_LIST
                              : LIST_REORDER_POSTER_GRID
                          }
                          variant={viewMode === "list" ? "list" : "grid"}
                        />
                      )
                    }}
                  </SortableOverlay>
                </Sortable>
              </motion.div>
            ) : viewMode === "grid" ? (
              <div className="ck-catalog-grid grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                {films.map((film) => (
                  <div
                    key={`${film.tmdb_id}-${film.media_type ?? "movie"}-${film.position}`}
                    className="group relative flex items-end justify-end gap-2"
                  >
                    {film.media_type === "tv" ? (
                      <SeriesCard
                        series={{
                          id: film.tmdb_id,
                          name: film.title,
                          poster_path: film.poster_path || null,
                          vote_average: 0,
                          first_air_date: film.release_date ?? null,
                        }}
                        externalid={film.tmdb_id}
                      />
                    ) : (
                      <MovieCard
                        movie={{
                          id: film.tmdb_id,
                          title: film.title,
                          poster_path: film.poster_path || null,
                          release_date: film.release_date ?? "",
                          vote_average: 0,
                        }}
                        externalid={film.tmdb_id}
                      />
                    )}
                    {canEdit ? (
                      <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFilm(film)}
                          className="rounded-md border border-transparent bg-black/60 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:border-white/20 hover:text-brand group-hover:opacity-100"
                          title="Remove film"
                        >
                          <IoTrashOutline className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {canEdit ? (
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="group relative aspect-[2/3] w-full overflow-hidden rounded-[10px] ring-1 ring-dashed ring-white/15 transition-colors hover:ring-white/30"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-white/40 transition-colors group-hover:text-white/70" />
                    </div>
                  </button>
                ) : null}
              </div>
            ) : (
              /* Clean list rows — poster + title + year, no card borders */
              <div className="flex flex-col">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="mb-2 flex w-full items-center justify-center gap-2 py-3 text-sm text-white/40 transition-colors hover:text-white/70"
                  >
                    <Plus className="h-4 w-4" />
                    Add films
                  </button>
                ) : null}
                {films.map((film) => {
                  const year = film.release_date?.slice(0, 4) || null
                  const href =
                    film.media_type === "tv"
                      ? seriesHref({
                          id: film.tmdb_id,
                          name: film.title,
                          first_air_date: film.release_date,
                        })
                      : filmHref({
                          id: film.tmdb_id,
                          title: film.title,
                          release_date: film.release_date,
                        })
                  return (
                    <div
                      key={`${film.tmdb_id}-${film.media_type ?? "movie"}-${film.position}`}
                      className="group flex items-center gap-4 py-3 transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-white/25">
                        {film.position}
                      </span>
                      <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
                        <img
                          src={
                            film.poster_path
                              ? `https://image.tmdb.org/t/p/w185/${film.poster_path}`
                              : "/placeholder.svg"
                          }
                          alt=""
                          className="h-14 w-10 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium text-white/90">
                            {film.title}
                          </p>
                          <p className="mt-0.5 text-xs text-white/35">
                            {[year, film.media_type === "tv" ? "Series" : null]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </p>
                        </div>
                      </Link>
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFilm(film)}
                          className="h-8 w-8 shrink-0 p-0 text-white/25 opacity-0 transition-opacity hover:text-brand group-hover:opacity-100"
                          title="Remove film"
                        >
                          <IoTrashOutline className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </article>
      </div>
    </>
  )
}
