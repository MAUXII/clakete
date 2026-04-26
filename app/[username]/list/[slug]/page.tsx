"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
import { List, ListFilm } from "@/types/list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Film, Heart, Copy, Share2, Tags } from "lucide-react";
import Link from "next/link";
import { useLists } from "@/hooks/use-lists";
import {
  CommandDialog,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { ImageEditDialog } from "@/components/profile/avatar-edit-dialog";
import { MovieCard } from "@/components/movies/movie-card";
import { IoTrashOutline } from "react-icons/io5";
import { userProfilePath } from "@/lib/list-href";

interface SearchResult {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
}

export default function UserListDetailPage() {
  const params = useParams();
  const profileUsername = String(params.username || "").toLowerCase();
  const listSlug = decodeURIComponent(String(params.slug || ""));
  const supabase = useSupabaseClient<Database>();
  const currentUser = useUser();
  const { addFilmToList, removeFilmFromList, updateList } = useLists();

  const [list, setList] = useState<List | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [films, setFilms] = useState<ListFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const [showBannerEdit, setShowBannerEdit] = useState(false);

  const canEdit = currentUser?.id === list?.user_id;

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
            .from("list_films")
            .select("*")
            .eq("list_id", listData.id)
            .order("position");

          if (filmsError) throw filmsError;

          setList({
            ...listData,
            id: String(listData.id),
            userData: userData || undefined,
            films_count: filmsData?.length || 0,
          });
          setFilms(filmsData || []);
        }
      } catch {
        setError("Erro ao carregar lista");
        setList(null);
        setListId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListData();
  }, [profileUsername, listSlug, supabase]);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!canEdit) return;

      setIsSearching(true);
      try {
        let endpoint = "";
        if (debouncedQuery.trim().length === 0) {
          endpoint = "/api/movies?type=top_rated";
        } else {
          endpoint = `/api/movies/search?q=${encodeURIComponent(debouncedQuery)}`;
        }
        const response = await fetch(endpoint);
        const data = await response.json();

        setResults(data.results || []);
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    };

    if (showSearchDialog) {
      fetchMovies();
    }
  }, [debouncedQuery, showSearchDialog, canEdit]);

  const handleFilmSelect = async (filmId: number) => {
    if (!canEdit || !currentUser || !listId) return;

    try {
      const selectedMovie = results.find((m) => m.id === filmId);
      if (!selectedMovie) return;

      const nextPosition = films.length + 1;

      const success = await addFilmToList(listId, {
        film_id: filmId,
        title: selectedMovie.title,
        poster_path: selectedMovie.poster_path,
        release_date: selectedMovie.release_date,
        position: nextPosition,
      });

      if (success) {
        const newFilm: ListFilm = {
          id: "",
          list_id: listId,
          film_id: filmId,
          title: selectedMovie.title,
          poster_path: selectedMovie.poster_path,
          release_date: selectedMovie.release_date,
          position: nextPosition,
          added_at: new Date().toISOString(),
        };

        setFilms((prev) => [...prev, newFilm]);
        setList((prev) => (prev ? { ...prev, films_count: (prev.films_count || 0) + 1 } : null));
      }

      setShowSearchDialog(false);
      setQuery("");
    } catch {
      /* ignore */
    }
  };

  const handleRemoveFilm = async (film: ListFilm) => {
    if (!canEdit || !currentUser || !listId) return;

    try {
      const success = await removeFilmFromList(listId, film.film_id);

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
      <div className="mx-auto mt-20 w-full max-w-6xl pb-12 pt-6">
        <div className="animate-pulse">
          <div className="h-[485px] w-full rounded-2xl bg-muted max-md:h-[360px]" />
          <div className="mt-10 space-y-4">
            <div className="h-9 w-2/3 max-w-md rounded-md bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 max-w-sm rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !list || !listId) {
    return (
      <div className="mx-auto mt-20 w-full max-w-6xl py-16">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">Lista não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A lista que você está procurando não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-20 w-full max-w-6xl pb-16 pt-6">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="group relative h-[485px] w-full rounded-2xl border border-black/20 bg-muted bg-cover bg-center max-md:h-[360px] dark:border-white/20"
          style={{
            backgroundImage: `url(${list.backdrop_path || "/wavebg.png"})`,
            backgroundPosition: "center 22%",
          }}
          onClick={() => canEdit && setShowBannerEdit(true)}
        >
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowBannerEdit(true)}
              className="absolute inset-0 z-10 flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-black/50 opacity-0 backdrop-blur-[1.2px] transition-opacity group-hover:opacity-100"
            >
              <span className="text-white">{list.backdrop_path ? "Atualizar banner" : "Adicionar banner"}</span>
            </button>
          )}
        </div>
      </div>

      <header className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Atualizada em {new Date(list.updated_at).toLocaleDateString("pt-BR")}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{list.title}</h1>

          {list.bio && (
            <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground md:text-base">{list.bio}</p>
          )}

          <div className="flex items-center gap-3 border-t border-border/50 pt-4">
            <Link
              href={userProfilePath(list.userData?.username)}
              className="flex items-center gap-3 rounded-full pl-0.5 transition-opacity hover:opacity-90"
            >
              <Avatar className="h-9 w-9 ring-1 ring-border/60">
                <AvatarImage
                  src={list.userData?.avatar_url || undefined}
                  alt={list.userData?.display_name || list.userData?.username || ""}
                />
                <AvatarFallback className="text-sm font-medium">
                  {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground/90 transition-colors hover:text-[#e94e7a]">
                {list.userData?.display_name || list.userData?.username}
              </span>
            </Link>
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-border/50 bg-card/40 p-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Curtir esta lista
            </span>
            <span className="text-xs">{films.length * 11 + 42}</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Clonar lista
            </span>
            <span className="text-xs">{Math.max(1, Math.floor(films.length / 3))} clones</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar
            </span>
          </button>
          <div className="rounded-md border border-border/50 bg-background/40 p-3 text-sm">
            <div className="mb-2 flex items-center justify-between text-muted-foreground">
              <span>Progresso</span>
              <span>{films.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#38bdf8]"
                style={{ width: `${Math.min(100, Math.round((films.length / 250) * 100))}%` }}
              />
            </div>
          </div>
          <div className="rounded-md border border-border/50 bg-background/40 p-3">
            <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Tags className="h-3.5 w-3.5" />
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">cinema</span>
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {list.is_public ? "pública" : "privada"}
              </span>
              <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                {films.length >= 50 ? "longa lista" : "curadoria"}
              </span>
            </div>
          </div>
        </aside>
      </header>

      <section className="mt-12 space-y-6 border-t border-border/50 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground/90">Filmes da lista</h2>
        </div>
        {films.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhum filme nesta lista ainda.</p>
            {canEdit && (
              <Button
                onClick={() => setShowSearchDialog(true)}
                className="mt-5"
                size="sm"
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar filmes
              </Button>
            )}
          </div>
        ) : (
          <>
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={() => setShowSearchDialog(true)} size="sm" variant="outline">
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Adicionar filmes
                </Button>
              </div>
            )}

            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {films.map((film) => (
                <div key={film.id} className="group relative flex items-end justify-end gap-2">
                  <MovieCard
                    movie={{
                      id: film.film_id,
                      title: film.title,
                      poster_path: film.poster_path || null,
                      vote_average: 0,
                    }}
                    externalid={film.film_id}
                  />
                  {canEdit && (
                    <div className="absolute bottom-2 right-2 flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFilm(film)}
                        className="rounded-md border border-transparent bg-black/60 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:border-[#FF0048]/30 hover:text-[#FF0048] group-hover:opacity-100"
                        title="Remover filme"
                      >
                        <IoTrashOutline className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <CommandDialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <CommandInput placeholder="Buscar filmes" value={query} onValueChange={setQuery} />
        <CommandList className="custom-scrollbar h-full max-h-[600px] overflow-y-auto">
          {isSearching && <CommandEmpty>Buscando...</CommandEmpty>}
          {!isSearching && results.length === 0 && query && (
            <CommandEmpty>Nenhum filme encontrado.</CommandEmpty>
          )}
          {!isSearching && results.length > 0 && (
            <CommandGroup className="gap-2" heading="Selecione um filme">
              {results.map((movie) => (
                <CommandItem
                  key={movie.id}
                  className="mx-3 my-4"
                  style={{ padding: "0px" }}
                  value={movie.title || ""}
                  onSelect={() => {
                    handleFilmSelect(movie.id);
                    setShowSearchDialog(false);
                  }}
                >
                  <div className="relative flex w-full flex-col items-center">
                    {movie.backdrop_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`}
                        alt={movie.title || ""}
                        className="h-48 w-full rounded object-cover"
                      />
                    ) : movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342/${movie.poster_path}`}
                        alt={movie.title || ""}
                        className="h-48 w-full rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-48 w-full items-center justify-center rounded bg-muted">
                        <span className="text-muted-foreground">Sem imagem disponível</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60 p-4">
                      <p className="text-center font-bold text-white">{movie.title}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {showBannerEdit && (
        <ImageEditDialog
          isOpen={showBannerEdit}
          onClose={() => setShowBannerEdit(false)}
          onSave={async (imageUrl: string) => {
            try {
              await updateList(listId, { backdrop_path: imageUrl });
              setList((prev) => (prev ? { ...prev, backdrop_path: imageUrl } : null));
              setShowBannerEdit(false);
            } catch {
              /* ignore */
            }
          }}
          type="banner"
          onSelect={() => {}}
        />
      )}
    </div>
  );
}
