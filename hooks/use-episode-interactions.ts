"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Database } from "@/lib/supabase/database.types";

type EpisodeInteractionRow =
  Database["public"]["Tables"]["episode_interactions"]["Row"];

export type SeasonEpisodeRef = {
  episode_number: number;
  id?: number;
};

/**
 * Batch de episódios assistidos de uma temporada.
 * Opcionalmente sincroniza a série (items_interactions) quando
 * o total de eps assistidos da série >= seriesEpisodeTotal.
 */
export function useEpisodeInteractions(
  seriesTmdbId: number,
  seasonNumber: number,
  opts?: {
    seriesEpisodeTotal?: number | null;
    seriesTitle?: string | null;
    seriesPosterPath?: string | null;
  }
) {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updatingEpisode, setUpdatingEpisode] = useState<number | null>(null);
  const [updatingSeason, setUpdatingSeason] = useState(false);

  const seriesEpisodeTotal = opts?.seriesEpisodeTotal ?? null;
  const seriesTitle = opts?.seriesTitle ?? null;
  const seriesPosterPath = opts?.seriesPosterPath ?? null;

  const fetchWatched = useCallback(async () => {
    if (!user) {
      setWatched(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("episode_interactions")
        .select("episode_number, is_watched")
        .eq("user_id", user.id)
        .eq("series_tmdb_id", seriesTmdbId)
        .eq("season_number", seasonNumber)
        .eq("is_watched", true);

      if (error) {
        console.error("[episode_interactions] fetch", error);
        return;
      }

      setWatched(
        new Set(
          (
            data as Pick<
              EpisodeInteractionRow,
              "episode_number" | "is_watched"
            >[]
          ).map((row) => row.episode_number)
        )
      );
    } catch (err) {
      console.error("[episode_interactions] fetch", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, seriesTmdbId, seasonNumber]);

  useEffect(() => {
    void fetchWatched();
  }, [fetchWatched]);

  const isWatched = useCallback(
    (episodeNumber: number) => watched.has(episodeNumber),
    [watched]
  );

  const watchedCount = watched.size;

  /** Se já assistiu todos os eps da série → marca a série (não o contrário). */
  const syncSeriesIfComplete = useCallback(async () => {
    if (!user || !seriesEpisodeTotal || seriesEpisodeTotal < 1) return;

    const { count, error } = await supabase
      .from("episode_interactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("series_tmdb_id", seriesTmdbId)
      .eq("is_watched", true);

    if (error) {
      console.error("[episode_interactions] series sync count", error);
      return;
    }

    if ((count ?? 0) < seriesEpisodeTotal) return;

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from("items_interactions")
      .upsert(
        {
          user_id: user.id,
          tmdb_id: seriesTmdbId,
          media_type: "tv",
          is_watched: true,
          in_watchlist: false,
          movie_title: seriesTitle,
          poster_path: seriesPosterPath,
          updated_at: now,
        },
        { onConflict: "user_id,tmdb_id,media_type" }
      );

    if (upsertError) {
      console.error("[episode_interactions] series sync", upsertError);
    }
  }, [
    supabase,
    user,
    seriesTmdbId,
    seriesEpisodeTotal,
    seriesTitle,
    seriesPosterPath,
  ]);

  const setEpisodeWatched = useCallback(
    async (
      episodeNumber: number,
      next: boolean,
      tmdbEpisodeId?: number | null
    ): Promise<boolean> => {
      if (!user) return false;
      setUpdatingEpisode(episodeNumber);

      setWatched((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(episodeNumber);
        else copy.delete(episodeNumber);
        return copy;
      });

      try {
        const now = new Date().toISOString();
        const { error } = await supabase.from("episode_interactions").upsert(
          {
            user_id: user.id,
            series_tmdb_id: seriesTmdbId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            tmdb_episode_id: tmdbEpisodeId ?? null,
            is_watched: next,
            watched_at: next ? now : null,
            updated_at: now,
          },
          { onConflict: "user_id,series_tmdb_id,season_number,episode_number" }
        );

        if (error) {
          console.error("[episode_interactions] upsert", error);
          setWatched((prev) => {
            const copy = new Set(prev);
            if (next) copy.delete(episodeNumber);
            else copy.add(episodeNumber);
            return copy;
          });
          return false;
        }

        if (next) await syncSeriesIfComplete();
        return true;
      } catch (err) {
        console.error("[episode_interactions] upsert", err);
        setWatched((prev) => {
          const copy = new Set(prev);
          if (next) copy.delete(episodeNumber);
          else copy.add(episodeNumber);
          return copy;
        });
        return false;
      } finally {
        setUpdatingEpisode(null);
      }
    },
    [supabase, user, seriesTmdbId, seasonNumber, syncSeriesIfComplete]
  );

  const toggleWatched = useCallback(
    async (episodeNumber: number, tmdbEpisodeId?: number | null) => {
      const next = !watched.has(episodeNumber);
      const ok = await setEpisodeWatched(episodeNumber, next, tmdbEpisodeId);
      return ok ? next : null;
    },
    [watched, setEpisodeWatched]
  );

  const markWatched = useCallback(
    async (episodeNumber: number, tmdbEpisodeId?: number | null) => {
      if (watched.has(episodeNumber)) return true;
      return setEpisodeWatched(episodeNumber, true, tmdbEpisodeId);
    },
    [watched, setEpisodeWatched]
  );

  const setSeasonWatched = useCallback(
    async (episodes: SeasonEpisodeRef[], next: boolean): Promise<boolean> => {
      if (!user || episodes.length === 0) return false;
      setUpdatingSeason(true);

      const prev = new Set(watched);
      setWatched(() => {
        if (next) return new Set(episodes.map((e) => e.episode_number));
        return new Set();
      });

      try {
        const now = new Date().toISOString();
        const rows = episodes.map((ep) => ({
          user_id: user.id,
          series_tmdb_id: seriesTmdbId,
          season_number: seasonNumber,
          episode_number: ep.episode_number,
          tmdb_episode_id: ep.id ?? null,
          is_watched: next,
          watched_at: next ? now : null,
          updated_at: now,
        }));

        const { error } = await supabase
          .from("episode_interactions")
          .upsert(rows, {
            onConflict: "user_id,series_tmdb_id,season_number,episode_number",
          });

        if (error) {
          console.error("[episode_interactions] season upsert", error);
          setWatched(prev);
          return false;
        }

        if (next) await syncSeriesIfComplete();
        return true;
      } catch (err) {
        console.error("[episode_interactions] season upsert", err);
        setWatched(prev);
        return false;
      } finally {
        setUpdatingSeason(false);
      }
    },
    [
      supabase,
      user,
      seriesTmdbId,
      seasonNumber,
      watched,
      syncSeriesIfComplete,
    ]
  );

  return {
    user,
    loading,
    updatingEpisode,
    updatingSeason,
    watchedCount,
    isWatched,
    toggleWatched,
    markWatched,
    setSeasonWatched,
    refetch: fetchWatched,
  };
}
