"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
import { toLocalDateString } from "@/lib/watched-date";
import { toast } from "sonner";

interface FilmInteractions {
  rating: number;
  review: string;
  isWatched: boolean;
  isLiked: boolean;
  isInWatchlist: boolean;
  watchedDate: string | null;
  rewatchCount: number;
  poster_path?: string;
  movie_title?: string;
  release_date?: string | null;
}

type FilmInteractionRow = Database["public"]["Tables"]["items_interactions"]["Row"];

export type FilmInteractionMediaType = "movie" | "tv";

function rowToState(
  data: FilmInteractionRow | null,
  posterPath?: string,
  movieTitle?: string,
  releaseDate?: string,
): FilmInteractions {
  if (!data) {
    return {
      rating: 0,
      review: "",
      isWatched: false,
      isLiked: false,
      isInWatchlist: false,
      watchedDate: null,
      rewatchCount: 0,
      poster_path: posterPath,
      movie_title: movieTitle,
      release_date: releaseDate,
    };
  }

  return {
    rating: data.rating || 0,
    review: data.review || "",
    isWatched: data.is_watched,
    isLiked: data.is_liked,
    isInWatchlist: data.in_watchlist,
    watchedDate: data.watched_date,
    rewatchCount: data.rewatch_count ?? 0,
    poster_path: data.poster_path,
    movie_title: data.movie_title,
    release_date: data.release_date,
  };
}

export function useFilmInteractions(
  filmId: number,
  posterPath?: string,
  movieTitle?: string,
  releaseDate?: string,
  mediaType: FilmInteractionMediaType = "movie",
) {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [interactions, setInteractions] = useState<FilmInteractions>({
    rating: 0,
    review: "",
    isWatched: false,
    isLiked: false,
    isInWatchlist: false,
    watchedDate: null,
    rewatchCount: 0,
    poster_path: posterPath,
    movie_title: movieTitle,
    release_date: releaseDate,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchInteractions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("items_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("tmdb_id", filmId)
        .eq("media_type", mediaType)
        .maybeSingle();

      if (error) {
        console.error("Error fetching film interactions:", error);
        return;
      }

      setInteractions(rowToState(data, posterPath, movieTitle, releaseDate));
    } catch (error) {
      console.error("Error fetching film interactions:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, filmId, posterPath, movieTitle, releaseDate, mediaType]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`items_interactions:${filmId}:${mediaType}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'items_interactions',
          filter: `user_id=eq.${user.id} AND tmdb_id=eq.${filmId} AND media_type=eq.${mediaType}`,
        },
        (payload: { new: FilmInteractionRow }) => {
          if (payload.new) {
            setInteractions(rowToState(payload.new, posterPath, movieTitle, releaseDate));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, filmId, mediaType, posterPath, movieTitle, releaseDate]);

  const updateInteractions = async (updates: Partial<FilmInteractions>) => {
    if (!user) {
      toast.error("Please sign in to interact with titles");
      return;
    }

    setUpdating(true);

    const newInteractions = {
      ...interactions,
      ...updates,
    };
    setInteractions(newInteractions);

    try {
      const { error } = await supabase
        .from("items_interactions")
        .upsert({
          user_id: user.id,
          tmdb_id: filmId,
          media_type: mediaType,
          rating: newInteractions.rating,
          review: newInteractions.review,
          is_watched: newInteractions.isWatched,
          is_liked: newInteractions.isLiked,
          in_watchlist: newInteractions.isInWatchlist,
          watched_date: newInteractions.isWatched ? newInteractions.watchedDate : null,
          rewatch_count: newInteractions.isWatched ? newInteractions.rewatchCount : 0,
          poster_path: posterPath || newInteractions.poster_path,
          movie_title: movieTitle || newInteractions.movie_title,
          release_date: releaseDate || newInteractions.release_date,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tmdb_id,media_type",
        });

      if (error) {
        console.error("Error updating film interactions:", error);
        toast.error("Could not save watch log");
        void fetchInteractions();
      }
    } catch (error) {
      console.error("Error updating film interactions:", error);
      toast.error("Could not save watch log");
      void fetchInteractions();
    } finally {
      setUpdating(false);
    }
  };

  const setRating = (rating: number) => updateInteractions({ rating });
  const setReview = (review: string) => updateInteractions({ review });

  const logWatch = async (payload: { watchedDate: string; isRewatch?: boolean }) => {
    const isRewatch = Boolean(payload.isRewatch && interactions.isWatched);
    await updateInteractions({
      isWatched: true,
      watchedDate: payload.watchedDate,
      rewatchCount: isRewatch
        ? interactions.rewatchCount + 1
        : interactions.isWatched
          ? interactions.rewatchCount
          : 0,
      isInWatchlist: false,
    });
  };

  const unwatch = async () => {
    await updateInteractions({
      isWatched: false,
      watchedDate: null,
      rewatchCount: 0,
    });
  };

  /** Quick toggle for cards: today / clear. Detail pages should use logWatch dialog. */
  const toggleWatched = async () => {
    if (interactions.isWatched) {
      await unwatch();
      return;
    }
    await logWatch({ watchedDate: toLocalDateString(), isRewatch: false });
  };

  const toggleLiked = () => updateInteractions({ isLiked: !interactions.isLiked });
  const toggleWatchlist = () =>
    updateInteractions({ isInWatchlist: !interactions.isInWatchlist });

  useEffect(() => {
    void fetchInteractions();
  }, [fetchInteractions]);

  return {
    ...interactions,
    loading,
    updating,
    setRating,
    setReview,
    logWatch,
    unwatch,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
  };
}
