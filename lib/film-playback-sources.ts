/**
 * Playback: arquivo próprio via FILM_PLAYBACK_URL_TEMPLATE (`{id}` = TMDB),
 * SuperFlix (catálogo público) e iframes via FILM_SOURCE_IFRAME_OVERRIDES_JSON.
 */

import {
  buildMoviePlayerUrl,
  getMovieCatalogSet,
} from "@/lib/superflix";

export type IframePlaybackSource = {
  id: string;
  label: string;
  url: string;
};

export function resolveOwnPlaybackUrl(filmId: string): string | null {
  const template = process.env.FILM_PLAYBACK_URL_TEMPLATE?.trim();
  if (!template) return null;

  const raw = template.replaceAll("{id}", filmId).trim();
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * JSON no .env.local (uma linha). Exemplo:
 * {"550":[{"id":"cdn","label":"CDN","url":"https://cdn.exemplo.com/embed/550"}]}
 *
 * Forma alternativa (sem label): {"550":{"cdn":"https://..."}}
 */
export function parseIframeOverridesForFilm(filmId: string): IframePlaybackSource[] {
  const raw = process.env.FILM_SOURCE_IFRAME_OVERRIDES_JSON?.trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];

  const entry = (parsed as Record<string, unknown>)[filmId];
  if (!entry) return [];

  if (Array.isArray(entry)) {
    const out: IframePlaybackSource[] = [];
    for (const item of entry) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const label = typeof o.label === "string" ? o.label : id;
      const url = typeof o.url === "string" ? o.url : "";
      if (id && url && isHttpsUrl(url)) out.push({ id, label, url });
    }
    return out;
  }

  if (typeof entry === "object" && !Array.isArray(entry)) {
    const out: IframePlaybackSource[] = [];
    for (const [key, val] of Object.entries(entry as Record<string, unknown>)) {
      if (typeof val === "string" && val && isHttpsUrl(val)) {
        out.push({ id: key, label: key, url: val });
      }
    }
    return out;
  }

  return [];
}

async function fetchTmdbImdbId(tmdbId: number): Promise<string | null> {
  const apiKey = process.env.NEXT_TMDB_API_KEY;
  const base =
    process.env.NEXT_PUBLIC_TMDB_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.themoviedb.org/3";
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${base}/movie/${tmdbId}/external_ids?api_key=${apiKey}`,
      { next: { revalidate: 86_400 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { imdb_id?: string | null };
    const imdb = typeof data.imdb_id === "string" ? data.imdb_id.trim() : "";
    return imdb || null;
  } catch {
    return null;
  }
}

/**
 * Resolve fonte SuperFlix para o filme (IMDb/TMDB presentes no catálogo).
 * Se o catálogo estiver indisponível, faz fallback otimista pelo IMDb.
 * Falhas de rede não quebram as demais fontes.
 */
export async function resolveSuperflixMovieSource(
  tmdbId: number
): Promise<IframePlaybackSource | null> {
  if (process.env.SUPERFLIX_ENABLED === "false") return null;

  try {
    const imdbId = await fetchTmdbImdbId(tmdbId);
    const candidates = [imdbId, String(tmdbId)].filter(
      (x): x is string => Boolean(x)
    );
    if (candidates.length === 0) return null;

    let catalogFailed = false;
    const sets: Partial<Record<"imdb" | "tmdb", Set<string>>> = {};

    async function inCatalog(id: string): Promise<boolean | null> {
      const kind = id.toLowerCase().startsWith("tt") ? "imdb" : "tmdb";
      try {
        if (!sets[kind]) {
          sets[kind] = await getMovieCatalogSet(kind);
        }
        return sets[kind]!.has(id.toLowerCase());
      } catch {
        catalogFailed = true;
        return null;
      }
    }

    for (const id of candidates) {
      const hit = await inCatalog(id);
      if (hit === true || (hit === null && catalogFailed)) {
        return {
          id: "superflix",
          label: "SuperFlix",
          url: buildMoviePlayerUrl(id),
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function mergeIframeSources(
  tmdbId: number,
  filmId: string
): Promise<IframePlaybackSource[]> {
  const map = new Map<string, IframePlaybackSource>();

  const superflix = await resolveSuperflixMovieSource(tmdbId);
  if (superflix) map.set(superflix.id, superflix);

  for (const s of parseIframeOverridesForFilm(filmId)) {
    map.set(s.id, s);
  }

  return [...map.values()];
}
