"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { RealtimeChannel } from '@supabase/supabase-js'

interface FilmInteractions {
  rating: number;
  review: string;
  isWatched: boolean;
  isLiked: boolean;
  isInWatchlist: boolean;
  poster_path?: string;
  movie_title?: string;
  release_date?: string;
}

type FilmInteractionRow = Database['public']['Tables']['film_interactions']['Row'];

export function useFilmInteractions(filmId: number, posterPath?: string, movieTitle?: string, releaseDate?: string) {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [interactions, setInteractions] = useState<FilmInteractions>({
    rating: 0,
    review: "",
    isWatched: false,
    isLiked: false,
    isInWatchlist: false,
    poster_path: posterPath,
    movie_title: movieTitle,
    release_date: releaseDate,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch all interactions for this film
  const fetchInteractions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("film_interactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("film_id", filmId)
        .single();

      // Se não houver dados, é normal - significa que o usuário ainda não interagiu com o filme
      if (!data) {
        setInteractions({
          rating: 0,
          review: "",
          isWatched: false,
          isLiked: false,
          isInWatchlist: false,
          poster_path: posterPath,
          movie_title: movieTitle,
          release_date: releaseDate,
        });
        return;
      }

      // Se tiver dados, atualiza o estado
      setInteractions({
        rating: data.rating || 0,
        review: data.review || "",
        isWatched: data.is_watched,
        isLiked: data.is_liked,
        isInWatchlist: data.in_watchlist,
        poster_path: data.poster_path,
        movie_title: data.movie_title,
        release_date: data.release_date
      });
    } catch (error) {
      // Só loga o erro, sem mostrar toast
      console.error("Error fetching film interactions:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, filmId, posterPath, movieTitle, releaseDate]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`film_interactions:${filmId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'film_interactions',
          filter: `user_id=eq.${user.id} AND film_id=eq.${filmId}`,
        },
        (payload: { new: FilmInteractionRow }) => {
          if (payload.new) {
            setInteractions({
              rating: payload.new.rating || 0,
              review: payload.new.review || "",
              isWatched: payload.new.is_watched,
              isLiked: payload.new.is_liked,
              isInWatchlist: payload.new.in_watchlist,
              poster_path: payload.new.poster_path,
              movie_title: payload.new.movie_title,
              release_date: payload.new.release_date
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, filmId]);

  // Update interactions in Supabase
  const updateInteractions = async (updates: Partial<FilmInteractions>) => {
    if (!user) {
      toast.error("Por favor, faça login para interagir com filmes");
      return;
    }

    setUpdating(true);
    
    // Optimistically update local state first
    const newInteractions = {
      ...interactions,
      ...updates
    };
    setInteractions(newInteractions);

    try {
      const { error } = await supabase
        .from("film_interactions")
        .upsert({
          user_id: user.id,
          film_id: filmId,
          rating: newInteractions.rating,
          review: newInteractions.review,
          is_watched: newInteractions.isWatched,
          is_liked: newInteractions.isLiked,
          in_watchlist: newInteractions.isInWatchlist,
          poster_path: posterPath || newInteractions.poster_path,
          movie_title: movieTitle || newInteractions.movie_title,
          release_date: releaseDate || newInteractions.release_date,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,film_id'
        });

      if (error) {
        console.error("Error updating film interactions:", error);
        // Revert optimistic update on error
        fetchInteractions();
      }
    } catch (error) {
      console.error("Error updating film interactions:", error);
      // Revert optimistic update on error
      fetchInteractions();
    } finally {
      setUpdating(false);
    }
  };

  // Individual update functions
  const setRating = (rating: number) => updateInteractions({ rating });
  const setReview = (review: string) => updateInteractions({ review });
  const toggleWatched = () => updateInteractions({ isWatched: !interactions.isWatched });
  const toggleLiked = () => updateInteractions({ isLiked: !interactions.isLiked });
  const toggleWatchlist = () =>
    updateInteractions({ isInWatchlist: !interactions.isInWatchlist });

  // Fetch interactions on mount and when user/filmId changes
  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  return {
    ...interactions,
    loading,
    updating,
    setRating,
    setReview,
    toggleWatched,
    toggleLiked,
    toggleWatchlist,
  };
}
