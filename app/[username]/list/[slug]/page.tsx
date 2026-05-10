"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
import { List, ListItem } from "@/types/list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Copy, Share2, Tags, LayoutGrid, List as ListIcon, Clock3, Pencil } from "lucide-react";
import Link from "next/link";
import { useLists } from "@/hooks/use-lists";
import { CommandDialog } from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaSearch, type SeriesSearchResult } from "@/hooks/use-media-search";
import { MediaSearchCommandContent } from "@/components/movies/media-search-command-content";
import type { Movie } from "@/lib/tmdb/client";
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog";
import { MovieCard } from "@/components/movies/movie-card";
import { IoTrashOutline } from "react-icons/io5";
import { userProfilePath } from "@/lib/list-href";
import { listBannerPresentation, parseListBannerMeta } from "@/lib/list-banner";
import { FilmsCatalogShell } from "@/components/films/films-catalog-shell";
import { EditListDialog } from "@/components/profile/edit-list-dialog";
import { cn } from "@/lib/utils";

/** Igual ao hero em `app/film/[id]/page.tsx` — altura responsiva + full-bleed + fades. */
const LIST_LETTERBOX_HEIGHT = "clamp(400px, min(60vh, 680px), 780px)"

export default function UserListDetailPage() {
  const params = useParams();
  const profileUsername = String(params.username || "").toLowerCase();
  const listSlug = decodeURIComponent(String(params.slug || ""));
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const currentUser = useUser();
  const { addItemToList, removeItemFromList, updateList, fetchListLikesMeta, toggleListLike } = useLists();

  const [list, setList] = useState<List | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [films, setFilms] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const [showBannerEdit, setShowBannerEdit] = useState(false);
  const [editListDialogOpen, setEditListDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [watchedInList, setWatchedInList] = useState(0);

  const canEdit = currentUser?.id === list?.user_id;

  const filmsProgressKey = useMemo(
    () => films.map((f) => `${f.tmdb_id}:${f.id}:${f.media_type ?? "movie"}`).join("|"),
    [films],
  );

  const totalListItems = films.length

  const progressPercent =
    totalListItems === 0 ? 0 : Math.min(100, Math.round((watchedInList / totalListItems) * 100))

  const listTags = useMemo(() => {
    const raw = list?.tags
    if (!Array.isArray(raw)) return [] as string[]
    return raw.map((t) => String(t).trim()).filter(Boolean)
  }, [list?.tags])

  const { filmResults, seriesResults, loading: searchLoading } = useMediaSearch(
    debouncedQuery,
    showSearchDialog && !!canEdit
  );

  useEffect(() => {
    const fetchListData = async () => {
      if (!profileUsername || !listSlug) return;

      try {
        setLoading(true);
        setError(null);

        const { data: userRow, error: userErr } = await supabase
          .from("users")
          .select("id")
          .eq("username", profileUsername)
          .single();

        if (userErr || !userRow?.id) throw userErr || new Error("user");

        const { data: listData, error: listError } = await supabase
          .from("lists")
          .select("*")
          .eq("user_id", userRow.id)
          .eq("slug", listSlug)
          .single();

        if (listError) throw listError;

        if (listData) {
          setListId(String(listData.id));

          const { data: userData } = await supabase
            .from("users")
            .select("username, display_name, avatar_url")
            .eq("id", listData.user_id)
            .single();

          const { data: filmsData, error: filmsError } = await supabase
            .from("list_items")
            .select("*")
            .eq("list_id", listData.id)
            .order("position");

          if (filmsError) throw filmsError;

          setList({
            ...listData,
            id: String(listData.id),
            banner_meta: parseListBannerMeta(listData.banner_meta),
            userData: userData || undefined,
            films_count: filmsData?.length || 0,
          });
          setFilms(
            (filmsData || []).map((row) => ({
              ...row,
              id: String(row.id),
            })) as ListItem[],
          );
        }
      } catch {
        setError("Failed to load list");
        setList(null);
        setListId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListData();
  }, [profileUsername, listSlug, supabase]);

  useEffect(() => {
    const loadLikesAndProgress = async () => {
      if (!listId) return;

      const { count, liked } = await fetchListLikesMeta(listId, currentUser?.id ?? null);
      setLikeCount(count);
      setUserLiked(liked);

      if (films.length === 0) {
        setWatchedInList(0);
        return;
      }
      if (!currentUser?.id) {
        setWatchedInList(0);
        return;
      }

      const uniqueIds = [...new Set(films.map((f) => f.tmdb_id))];
      const { data: rows, error } = await supabase
        .from("items_interactions")
        .select("tmdb_id, media_type")
        .eq("user_id", currentUser.id)
        .eq("is_watched", true)
        .in("tmdb_id", uniqueIds);

      if (error) {
        setWatchedInList(0);
        return;
      }

      const watchedSet = new Set(
        rows?.map((r) => `${r.tmdb_id}:${r.media_type ?? "movie"}`) ?? [],
      );
      setWatchedInList(
        films.filter((f) =>
          watchedSet.has(`${f.tmdb_id}:${f.media_type ?? "movie"}`),
        ).length,
      );
    };

    void loadLikesAndProgress();
  }, [listId, filmsProgressKey, currentUser?.id, supabase, fetchListLikesMeta]);

  const handleToggleListLike = async () => {
    if (!listId) return;
    if (!currentUser) {
      router.push("/sign-in");
      return;
    }
    if (likePending) return;
    setLikePending(true);
    try {
      const res = await toggleListLike(listId);
      if (res) {
        setLikeCount(res.count);
        setUserLiked(res.liked);
      }
    } finally {
      setLikePending(false);
    }
  };

  const refreshListAfterEdit = useCallback(async () => {
    if (!listId) return;
    const { data: listData, error } = await supabase.from("lists").select("*").eq("id", listId).single();
    if (error || !listData) return;

    setList((prev) => ({
      ...listData,
      id: String(listData.id),
      banner_meta: parseListBannerMeta(listData.banner_meta),
      userData: prev?.userData,
      films_count: films.length,
    }));

    const nextSlug = listData.slug != null ? String(listData.slug) : "";
    if (nextSlug && nextSlug !== listSlug) {
      router.replace(`/${profileUsername}/list/${encodeURIComponent(nextSlug)}`);
    }
  }, [listId, supabase, films.length, listSlug, profileUsername, router]);

  const handleFilmSelect = async (selectedMovie: Movie) => {
    if (!canEdit || !currentUser || !listId) return;

    try {
      const filmId = selectedMovie.id;
      const nextPosition =
        films.length === 0
          ? 1
          : Math.max(...films.map((f) => f.position ?? 0)) + 1;

      const success = await addItemToList(listId, {
        tmdb_id: filmId,
        title: selectedMovie.title ?? "",
        poster_path: selectedMovie.poster_path ?? undefined,
        release_date: selectedMovie.release_date ?? undefined,
        position: nextPosition,
        media_type: "movie",
      });

      if (success) {
        const newFilm: ListItem = {
          id: "",
          list_id: listId,
          tmdb_id: filmId,
          title: selectedMovie.title ?? "",
          poster_path: selectedMovie.poster_path ?? undefined,
          release_date: selectedMovie.release_date ?? undefined,
          position: nextPosition,
          added_at: new Date().toISOString(),
          media_type: "movie",
        };

        setFilms((prev) => [...prev, newFilm]);
        setList((prev) => (prev ? { ...prev, films_count: (prev.films_count || 0) + 1 } : null));
      }
    } catch {
      /* ignore */
    }
  };

  const handleSeriesSelect = async (series: SeriesSearchResult) => {
    if (!canEdit || !currentUser || !listId) return;

    try {
      const nextPosition =
        films.length === 0
          ? 1
          : Math.max(...films.map((f) => f.position ?? 0)) + 1;

      const success = await addItemToList(listId, {
        tmdb_id: series.id,
        title: series.name ?? "",
        poster_path: series.poster_path ?? undefined,
        release_date: series.first_air_date ?? undefined,
        position: nextPosition,
        media_type: "tv",
      });

      if (success) {
        const newItem: ListItem = {
          id: "",
          list_id: listId,
          tmdb_id: series.id,
          title: series.name ?? "",
          poster_path: series.poster_path ?? undefined,
          release_date: series.first_air_date ?? undefined,
          position: nextPosition,
          added_at: new Date().toISOString(),
          media_type: "tv",
        };

        setFilms((prev) => [...prev, newItem]);
        setList((prev) => (prev ? { ...prev, films_count: (prev.films_count || 0) + 1 } : null));
      }
    } catch {
      /* ignore */
    }
  };

  const handleRemoveFilm = async (film: ListItem) => {
    if (!canEdit || !currentUser || !listId) return;

    try {
      const success = await removeItemFromList(listId, film.tmdb_id, film.media_type ?? "movie");

      if (success) {
        setFilms((prev) => prev.filter((f) => f.id !== film.id));
        setList((prev) => (prev ? { ...prev, films_count: Math.max(0, (prev.films_count || 0) - 1) } : null));
      }
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
        <FilmsCatalogShell>
          <div
            className="relative left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
            style={{ height: LIST_LETTERBOX_HEIGHT }}
            aria-hidden
          />
          <div className="relative z-10 mt-8 animate-pulse space-y-4 px-1">
            <div className="h-9 w-2/3 max-w-md rounded-md bg-white/[0.06]" />
            <div className="h-4 w-24 rounded bg-white/[0.06]" />
            <div className="h-4 max-w-sm rounded bg-white/[0.06]" />
          </div>
        </FilmsCatalogShell>
      </div>
    );
  }

  if (error || !list || !listId) {
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
        <FilmsCatalogShell>
          <div className="py-16 text-center">
            <h1 className="text-xl font-semibold tracking-tight">List not found</h1>
            <p className="mt-2 text-sm text-zinc-500">
              This list does not exist or may have been removed.
            </p>
          </div>
        </FilmsCatalogShell>
      </div>
    );
  }

  const bannerPres = listBannerPresentation(list);
  const listBackdropUrl = bannerPres.src;

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#09090B]">
      <FilmsCatalogShell>
        <div
          className="relative mt-[3.75rem] left-1/2 z-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-[#09090B]"
          style={{ height: LIST_LETTERBOX_HEIGHT }}
        >
          <div className="pointer-events-none absolute inset-0">
            {listBackdropUrl ? (
              <img
                src={listBackdropUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
                style={
                  bannerPres.objectPosition
                    ? { objectPosition: bannerPres.objectPosition }
                    : undefined
                }
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.06),transparent_55%)]" />
            )}
            <div
              className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.18)_0%,transparent_38%)]"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/10"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[linear-gradient(to_top,#09090B_0%,#09090B_0%,rgba(9,9,11,0.55)_32%,transparent_62%)]"
              aria-hidden
            />
            <img
              src="/noise.avif"
              alt=""
              className="pointer-events-none absolute inset-0 z-[4] h-full w-full object-cover opacity-[0.02]"
              aria-hidden
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setShowBannerEdit(true)}
              className="absolute inset-0 z-[5] flex cursor-pointer items-center justify-center bg-black/45 opacity-0 backdrop-blur-[1.2px] transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <span className="text-sm font-medium text-white">
                {list.banner_meta?.file_path || list.backdrop_path ? "Update banner" : "Add banner"}
              </span>
            </button>
          ) : null}
        </div>

        <header className="relative z-10 mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={userProfilePath(list.userData?.username)}
              className="group inline-flex items-center gap-3 rounded-full border border-border/60 bg-card/60 px-3 py-2 pr-4 shadow-sm backdrop-blur-sm transition-colors hover:border-[#e94e7a]/40 hover:bg-card"
            >
              <Avatar className="h-11 w-11 border border-white/10 ring-2 ring-background shadow-md">
                <AvatarImage
                  src={list.userData?.avatar_url || undefined}
                  alt={list.userData?.display_name || list.userData?.username || ""}
                />
                <AvatarFallback className="bg-muted text-sm font-semibold">
                  {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  List by
                </span>
                <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-[#e94e7a]">
                  @{list.userData?.username || "user"}
                </span>
              </div>
            </Link>

            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                Updated {new Date(list.updated_at).toLocaleDateString("en-US")}
              </span>
              <div className="inline-flex items-center rounded-full border border-border/60 bg-card/60 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  title="Grid"
                  className={`rounded-full p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "border border-[#FF0048]/20 bg-[#280F16] text-[#FF0048] hover:bg-[#280F16]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  title="List"
                  className={`rounded-full p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "border border-[#FF0048]/20 bg-[#280F16] text-[#FF0048] hover:bg-[#280F16]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{list.title}</h1>

          {list.bio && (
            <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{list.bio}</p>
          )}

          <section className="space-y-6">
            {films.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
                <p className="text-sm text-muted-foreground">No films in this list yet.</p>
                {canEdit && (
                  <Button
                    onClick={() => setShowSearchDialog(true)}
                    className="mt-5"
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add films
                  </Button>
                )}
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {films.map((film) => (
                      <div
                        key={`${film.tmdb_id}-${film.media_type ?? "movie"}-${film.position}`}
                        className="group relative flex items-end justify-end gap-2"
                      >
                        {film.media_type === "tv" ? (
                          <Link
                            href={`/series/${film.tmdb_id}`}
                            className="relative block aspect-[2/3] w-full overflow-hidden rounded-md border border-black/15 shadow-sm dark:border-white/15"
                          >
                            {film.poster_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
                                alt={film.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                                TV
                              </div>
                            )}
                          </Link>
                        ) : (
                          <MovieCard
                            movie={{
                              id: film.tmdb_id,
                              title: film.title,
                              poster_path: film.poster_path || null,
                              vote_average: 0,
                            }}
                            externalid={film.tmdb_id}
                          />
                        )}
                        {canEdit && (
                          <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFilm(film)}
                              className="rounded-md border border-transparent bg-black/60 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:border-[#FF0048]/30 hover:text-[#FF0048] group-hover:opacity-100"
                              title="Remove film"
                            >
                              <IoTrashOutline className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowSearchDialog(true)}
                        className="group relative aspect-[2/3] w-full overflow-hidden rounded-md border border-dashed border-white/15 transition-colors hover:border-[#FF0048]/40"
                        
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="h-5 w-5 text-white transition-colors group-hover:text-[#FF0048]" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setShowSearchDialog(true)}
                        className="flex w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/40 py-3 text-sm text-muted-foreground transition-colors hover:border-[#FF0048]/40 hover:text-[#FF0048]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add films
                      </button>
                    )}
                    {films.map((film) => (
                      <div
                        key={`${film.tmdb_id}-${film.media_type ?? "movie"}-${film.position}`}
                        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-2 pr-3 transition-colors hover:bg-card/70"
                      >
                        <div className="w-6 text-center text-xs font-semibold text-muted-foreground">
                          {film.position}
                        </div>
                        {film.media_type === "tv" ? (
                          <Link
                            href={`/series/${film.tmdb_id}`}
                            className="flex min-w-0 flex-1 items-center gap-3"
                          >
                            <img
                              src={
                                film.poster_path
                                  ? `https://image.tmdb.org/t/p/w185/${film.poster_path}`
                                  : "/placeholder.svg"
                              }
                              alt={film.title}
                              className="h-14 w-10 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{film.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {film.release_date ? film.release_date.slice(0, 4) : "—"} · Series
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <>
                            <img
                              src={
                                film.poster_path
                                  ? `https://image.tmdb.org/t/p/w185/${film.poster_path}`
                                  : "/placeholder.svg"
                              }
                              alt={film.title}
                              className="h-14 w-10 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{film.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {film.release_date ? film.release_date.slice(0, 4) : "—"}
                              </p>
                            </div>
                          </>
                        )}
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFilm(film)}
                            className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:text-[#FF0048]"
                            title="Remove film"
                          >
                            <IoTrashOutline className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

        </div>

        <aside className="sticky top-[calc(env(safe-area-inset-top,0px)+6.5rem)] z-10 h-fit w-full max-h-[calc(100dvh-8rem)] space-y-3 overflow-y-auto rounded-xl border border-border/50 bg-card/40 p-3">
          {canEdit && list ? (
            <button
              type="button"
              onClick={() => setEditListDialogOpen(true)}
              className="flex h-10 w-full items-center justify-center rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
            >
              <span className="inline-flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit list
              </span>
            </button>
          ) : null}
          <button
            type="button"
            disabled={likePending || !listId}
            onClick={() => void handleToggleListLike()}
            className={cn(
              "flex h-10 w-full items-center justify-center rounded-md border px-3 text-sm transition-colors disabled:opacity-60",
              userLiked
                ? "border-[#FF0048]/30 bg-[#FF0048]/10 text-[#FF0048] hover:bg-[#FF0048]/15"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50",
            )}
          >
            <span className="inline-flex items-center gap-2">
              <Heart
                className={cn("h-4 w-4 shrink-0 transition-colors", userLiked && "fill-[#FF0048] text-[#FF0048]")}
              />
              {userLiked ? "Liked" : "Like"}
              <span className="tabular-nums">{likeCount}</span>
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Clone list
            </span>
          </button>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border/50 bg-muted/30 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </span>
          </button>
          <div className="rounded-md border border-black/10 bg-[#FF0048]/5 p-3 text-sm dark:border-white/10">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Progress
              </span>
              <span className="tabular-nums text-xs sm:text-sm">
                <span className="font-semibold text-foreground">{watchedInList}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-muted-foreground">{totalListItems}</span>
                <span className="ml-1.5 font-medium text-muted-foreground">
                  ({progressPercent}%)
                </span>
              </span>
            </div>
            <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
              {currentUser
                ? "Movies & shows in this list that you’ve marked as watched on Clakete."
                : "Sign in to see your watch progress for titles in this list."}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted/80 ring-1 ring-black/5 dark:ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF0048]/85 to-[#FF0048] shadow-[0_0_12px_rgba(255,0,72,0.35)] transition-[width] duration-300 ease-out"
                style={{
                  width: totalListItems === 0 ? "0%" : `${progressPercent}%`,
                }}
              />
            </div>
          </div>
          {listTags.length > 0 ? (
            <div className="rounded-md border border-border/50 bg-background/40 p-3">
              <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Tags className="h-3.5 w-3.5" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {listTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </header>

      <CommandDialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <MediaSearchCommandContent
          query={query}
          onQueryChange={setQuery}
          filmResults={filmResults}
          seriesResults={seriesResults}
          loading={searchLoading}
          inputPlaceholder="Search"
          commandInputClassName="h-12 text-sm font-medium placeholder:text-zinc-500"
          commandListClassName="custom-scrollbar max-h-[600px] h-full overflow-y-auto"
          onSelectFilm={(movie) => {
            void handleFilmSelect(movie);
          }}
          onSelectSeries={(series) => {
            void handleSeriesSelect(series);
          }}
          filmRowMode="pick"
          seriesRowMode="pick"
        />
      </CommandDialog>

      {canEdit && list ? (
        <EditListDialog
          list={list}
          open={editListDialogOpen}
          onOpenChange={setEditListDialogOpen}
          onListUpdated={() => void refreshListAfterEdit()}
        />
      ) : null}

      {showBannerEdit && listId ? (
        <ImageEditDialog
          isOpen={showBannerEdit}
          onClose={() => setShowBannerEdit(false)}
          onSave={() => {}}
          type="list"
          listId={listId}
          customListBannerSave={async (meta) => {
            const ok = await updateList(listId, { backdrop_path: null, banner_meta: meta });
            if (ok) {
              setList((prev) =>
                prev ? { ...prev, backdrop_path: undefined, banner_meta: meta } : null,
              );
            }
          }}
          onSelect={() => {}}
        />
      ) : null}
      </FilmsCatalogShell>
    </div>
  );
}
