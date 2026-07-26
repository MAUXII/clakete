import axios from "axios"

import {
  buildTitleSlug,
  pickSlugTitle,
  yearFromDate,
} from "@/lib/media-href"
import { resolveMovieBySlug, resolveTvBySlug } from "@/lib/tmdb-search"

const TMDB_API_KEY = process.env.NEXT_TMDB_API_KEY
const TMDB_BASE_URL =
  process.env.NEXT_PUBLIC_TMDB_BASE_URL || "https://api.themoviedb.org/3"

export type CanonicalMovieSlug = {
  slug: string
  original_title: string | null
  release_date: string | null
}

export type CanonicalSeriesSlug = {
  slug: string
  original_name: string | null
  first_air_date: string | null
}

export async function canonicalMovieSlugById(
  id: number,
): Promise<CanonicalMovieSlug | null> {
  if (!Number.isFinite(id) || id <= 0) return null

  const { data } = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
    params: { api_key: TMDB_API_KEY, language: "en-US" },
  })

  const originalTitle = (data.original_title as string | undefined) ?? null
  const title = pickSlugTitle(originalTitle, data.title as string | undefined)
  const releaseDate = (data.release_date as string | undefined) ?? null

  if (!title) {
    return {
      slug: String(id),
      original_title: originalTitle,
      release_date: releaseDate,
    }
  }

  const probe = buildTitleSlug(title, yearFromDate(releaseDate))
  const hit = await resolveMovieBySlug(probe)

  return {
    slug: hit?.canonicalSlug ?? probe,
    original_title: originalTitle,
    release_date: releaseDate,
  }
}

export async function canonicalSeriesSlugById(
  id: number,
): Promise<CanonicalSeriesSlug | null> {
  if (!Number.isFinite(id) || id <= 0) return null

  const { data } = await axios.get(`${TMDB_BASE_URL}/tv/${id}`, {
    params: { api_key: TMDB_API_KEY, language: "en-US" },
  })

  const originalName = (data.original_name as string | undefined) ?? null
  const title = pickSlugTitle(originalName, data.name as string | undefined)
  const firstAirDate = (data.first_air_date as string | undefined) ?? null

  if (!title) {
    return {
      slug: String(id),
      original_name: originalName,
      first_air_date: firstAirDate,
    }
  }

  const probe = buildTitleSlug(title, yearFromDate(firstAirDate))
  const hit = await resolveTvBySlug(probe)

  return {
    slug: hit?.canonicalSlug ?? probe,
    original_name: originalName,
    first_air_date: firstAirDate,
  }
}
