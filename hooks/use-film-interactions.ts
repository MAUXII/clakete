"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
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
  originalTitle?: string | null,
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
  const [diaryLogCount, setDiaryLogCount] = useState(0);

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

      const { count } = await supabase
        .from("watch_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("tmdb_id", filmId)
        .eq("media_type", mediaType);
      setDiaryLogCount(count ?? 0);
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

  const updateInteractions = async (
    updates: Partial<FilmInteractions>,
    feedShare?: { visibility: "friends" | "public" },
  ) => {
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
      const title = movieTitle || newInteractions.movie_title || null;
      const poster = posterPath || newInteractions.poster_path || null;
      const release = releaseDate || newInteractions.release_date || null;

      const watchedDate =
        updates.watchedDate !== undefined
          ? updates.watchedDate
          : newInteractions.isWatched
            ? newInteractions.watchedDate
            : null
      const rewatchCount =
        updates.rewatchCount !== undefined
          ? updates.rewatchCount
          : newInteractions.isWatched
            ? newInteractions.rewatchCount
            : 0

      const payload: Database["public"]["Tables"]["items_interactions"]["Insert"] = {
        user_id: user.id,
        tmdb_id: filmId,
        media_type: mediaType,
        rating: newInteractions.rating,
        review: newInteractions.review,
        is_watched: newInteractions.isWatched,
        is_liked: newInteractions.isLiked,
        in_watchlist: newInteractions.isInWatchlist,
        watched_date: watchedDate,
        rewatch_count: rewatchCount,
        updated_at: new Date().toISOString(),
        ...(feedShare
          ? {
              feed_shared: true,
              feed_shared_at: new Date().toISOString(),
              feed_visibility: feedShare.visibility,
            }
          : {}),
      };

      // Only set denormalized fields when we have values — avoid wiping existing titles/posters
      if (title) payload.movie_title = title;
      if (poster) payload.poster_path = poster;
      if (release) payload.release_date = release;
      if (originalTitle?.trim()) {
        if (mediaType === "tv") payload.original_name = originalTitle.trim();
        else payload.original_title = originalTitle.trim();
      }

      const { error } = await supabase
        .from("items_interactions")
        .upsert(payload, {
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

  const syncWatchLog = async (payload: {
    watchIndex: number
    watchedDate: string
    rating?: number | null
    review?: string | null
  }) => {
    if (!user) return
    try {
      await supabase.from("watch_logs").upsert(
        {
          user_id: user.id,
          tmdb_id: filmId,
          media_type: mediaType,
          watch_index: payload.watchIndex,
          watched_date: payload.watchedDate,
          rating: payload.rating ?? null,
          review: payload.review ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,tmdb_id,media_type,watch_index" },
      )
    } catch (error) {
      console.error("Error syncing watch log:", error)
    }
  }

  const clearWatchLogs = async () => {
    if (!user) return
    try {
      await supabase
        .from("watch_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", filmId)
        .eq("media_type", mediaType)
    } catch (error) {
      console.error("Error clearing watch logs:", error)
    }
  }

  const setRating = (rating: number) => updateInteractions({ rating });

  const setReview = (
    review: string,
    options?: { shareToFeed?: boolean; visibility?: "friends" | "public" },
  ) =>
    updateInteractions(
      { review },
      options?.shareToFeed
        ? { visibility: options.visibility === "public" ? "public" : "friends" }
        : undefined,
    );

  const markWatched = async () => {
    await updateInteractions({
      isWatched: true,
      watchedDate: interactions.watchedDate,
      isInWatchlist: false,
    })
  }

  const logWatch = async (payload: {
    watchedDate: string
    isRewatch?: boolean
    rating?: number
    review?: string
    isLiked?: boolean
    shareToFeed?: boolean
    visibility?: "friends" | "public"
  }) => {
    const isRewatch = Boolean(payload.isRewatch && interactions.isWatched)
    const nextRewatchCount = isRewatch
      ? interactions.rewatchCount + 1
      : interactions.isWatched
        ? interactions.rewatchCount
        : 0
    const watchIndex = isRewatch ? nextRewatchCount : 0

    const nextRating = payload.rating ?? interactions.rating
    const nextReview = payload.review ?? interactions.review
    const feedShare =
      payload.shareToFeed && payload.review?.trim()
        ? {
            visibility:
              payload.visibility === "public"
                ? ("public" as const)
                : ("friends" as const),
          }
        : undefined

    await updateInteractions(
      {
        isWatched: true,
        watchedDate: payload.watchedDate,
        rewatchCount: nextRewatchCount,
        isInWatchlist: false,
        rating: nextRating,
        review: nextReview,
        ...(payload.isLiked !== undefined ? { isLiked: payload.isLiked } : {}),
      },
      feedShare,
    )

    await syncWatchLog({
      watchIndex,
      watchedDate: payload.watchedDate,
      rating: payload.rating && payload.rating > 0 ? payload.rating : null,
      review: payload.review?.trim() ? payload.review.trim() : null,
    })
    setDiaryLogCount((c) => (isRewatch ? c + 1 : Math.max(c, 1)))
  }

  const removeFromDiary = async () => {
    await clearWatchLogs();
    await updateInteractions({
      watchedDate: null,
      rewatchCount: 0,
    });
    setDiaryLogCount(0);
  };

  const unwatch = async () => {
    await clearWatchLogs();
    await updateInteractions({
      isWatched: false,
      isLiked: false,
      watchedDate: null,
      rewatchCount: 0,
      rating: 0,
      review: "",
    });
    setDiaryLogCount(0);
  };

  /** Mark watched (eye) or signal that unwatch needs confirmation. */
  const toggleWatched = async (): Promise<"needs-unwatch-confirm" | "done"> => {
    if (interactions.isWatched) {
      return "needs-unwatch-confirm";
    }
    await markWatched();
    return "done";
  };

  const toggleLiked = async () => {
    await updateInteractions({ isLiked: !interactions.isLiked });
  };
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
    markWatched,
    logWatch,
    removeFromDiary,
    unwatch,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
    diaryLogCount,
    hasDiaryLogs: diaryLogCount > 0,
  };
}
