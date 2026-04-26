"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
import { List, ListFilm } from "@/types/list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Calendar, Film, ArrowLeft, Image as LucideImage } from "lucide-react";
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
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 mt-20">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 rounded-lg border p-4">
                <div className="h-20 w-14 rounded bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !list || !listId) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 mt-20">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Lista não encontrada</h1>
          <p className="mb-6 text-muted-foreground">
            A lista que você está procurando não existe ou foi removida.
          </p>
          <Link href={`/${profileUsername}/lists`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às listas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 mt-20">
      <div className="mb-8">
        <div
          className="group relative h-[450px] w-full rounded-lg border border-black/20 bg-cover bg-center dark:border-white/20"
          style={{
            backgroundImage: `url(${list.backdrop_path || "/wavebg.png"})`,
            backgroundPosition: "center 20%",
          }}
        >
          {canEdit && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowBannerEdit(true)}
                className="flex cursor-pointer items-center justify-center rounded-lg bg-black/50 px-4 py-2 opacity-0 backdrop-blur-[1.2px] transition-opacity group-hover:opacity-100"
              >
                <span className="flex items-center gap-2 text-white">
                  <LucideImage className="h-4 w-4" />
                  {list.backdrop_path ? "Atualizar banner" : "Adicionar banner"}
                </span>
              </button>
            </div>
          )}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </div>

      <div className="mb-8">
        <Link
          href={`/${profileUsername}/lists`}
          className="mb-4 inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar às listas
        </Link>

        <h1 className="mb-2 text-3xl font-bold">{list.title}</h1>

        {list.bio && <p className="mb-4 text-muted-foreground">{list.bio}</p>}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>{films.length} filmes</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(list.updated_at).toLocaleDateString()}</span>
          </div>
          {list.is_public ? (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Pública</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <EyeOff className="h-4 w-4" />
              <span>Privada</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link href={userProfilePath(list.userData?.username)}>
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={list.userData?.avatar_url || undefined}
                alt={list.userData?.display_name || list.userData?.username || ""}
              />
              <AvatarFallback className="text-sm font-medium">
                {(list.userData?.display_name?.[0] || list.userData?.username?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link
            href={userProfilePath(list.userData?.username)}
            className="text-sm text-muted-foreground transition-colors hover:text-[#e94e7a]"
          >
            {list.userData?.display_name || list.userData?.username}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {films.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Esta lista ainda não tem filmes.</p>
            {canEdit && (
              <Button onClick={() => setShowSearchDialog(true)} className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro filme
              </Button>
            )}
          </div>
        ) : (
          <>
            {canEdit && films.length > 0 && (
              <Button onClick={() => setShowSearchDialog(true)} className="mt-4" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar mais filmes
              </Button>
            )}

            <div className="grid w-full grid-cols-5 gap-4">
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
                        className="group rounded-md border border-transparent bg-secondary p-2 text-white opacity-0 transition-opacity duration-300 hover:border-[#FF0048]/20 hover:bg-[#280F16] hover:text-[#FF0048] group-hover:opacity-100"
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
      </div>

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
