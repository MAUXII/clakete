import type {
  SuperflixCatalogCategory,
  SuperflixChannel,
  SuperflixChannelCategory,
  SuperflixEvent,
  SuperflixGenre,
  SuperflixIdType,
  SuperflixPlayerOptions,
} from "./types";

export const SUPERFLIX_BASE_URL =
  process.env.SUPERFLIX_BASE_URL?.replace(/\/+$/, "") ||
  "https://superflixapi.pro";

const DEFAULT_TIMEOUT_MS = 20_000;
const CATALOG_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

type CacheEntry<T> = { value: T; expiresAt: number };

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = CATALOG_CACHE_TTL_MS) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export class SuperflixApiError extends Error {
  readonly status?: number;
  readonly url: string;

  constructor(message: string, url: string, status?: number) {
    super(message);
    this.name = "SuperflixApiError";
    this.url = url;
    this.status = status;
  }
}

function buildListaUrl(
  params: Record<string, string | number | undefined | null>
): string {
  const url = new URL(`${SUPERFLIX_BASE_URL}/lista`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  if (!url.searchParams.has("format")) {
    url.searchParams.set("format", "json");
  }
  return url.toString();
}

async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  opts?.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new SuperflixApiError(
        `SuperFlix respondeu ${res.status}`,
        url,
        res.status
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof SuperflixApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new SuperflixApiError("Timeout ao contactar SuperFlix", url);
    }
    const msg = err instanceof Error ? err.message : "Erro de rede";
    throw new SuperflixApiError(msg, url);
  } finally {
    clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", onAbort);
  }
}

function applyPlayerHash(
  url: string,
  options?: SuperflixPlayerOptions
): string {
  const opts = {
    noEpList: true,
    noLink: true,
    ...options,
  };
  const parts: string[] = [];
  if (opts.noEpList) parts.push("noEpList");
  if (opts.noLink) parts.push("noLink");
  if (opts.transparent) parts.push("transparent");
  if (opts.color) parts.push(`color:${opts.color.replace(/^#/, "")}`);
  if (parts.length === 0) return url;
  return `${url}#${parts.join("#")}`;
}

/** URL do player de filme (IMDb `tt…` ou TMDB numérico). */
export function buildMoviePlayerUrl(
  id: string | number,
  options?: SuperflixPlayerOptions
): string {
  const clean = String(id).trim();
  const base = `${SUPERFLIX_BASE_URL}/filme/${encodeURIComponent(clean)}`;
  return applyPlayerHash(base, options);
}

/** URL do player de série/anime/dorama (TMDB). */
export function buildSeriesPlayerUrl(
  tmdbId: string | number,
  season = 1,
  episode = 1,
  options?: SuperflixPlayerOptions
): string {
  const id = encodeURIComponent(String(tmdbId).trim());
  const base = `${SUPERFLIX_BASE_URL}/serie/${id}/${season}/${episode}`;
  return applyPlayerHash(base, options);
}

/** URL do player de canal ao vivo. */
export function buildChannelPlayerUrl(
  channelId: string,
  options?: SuperflixPlayerOptions
): string {
  const id = encodeURIComponent(channelId.trim());
  const base = `${SUPERFLIX_BASE_URL}/canal/${id}`;
  return applyPlayerHash(base, { noEpList: false, noLink: true, ...options });
}

/** Lista gêneros disponíveis para uma categoria de catálogo. */
export async function listGenres(
  category: SuperflixCatalogCategory = "filme",
  signal?: AbortSignal
): Promise<SuperflixGenre[]> {
  const cacheKey = `genres:${category}`;
  const cached = getCached<SuperflixGenre[]>(cacheKey);
  if (cached) return cached;

  const url = buildListaUrl({ category, type: "generos" });
  const raw = await fetchJson<{ success?: boolean; data?: SuperflixGenre[] }>(
    url,
    { signal }
  );
  const data = Array.isArray(raw?.data) ? raw.data : [];
  setCached(cacheKey, data);
  return data;
}

/** Lista IDs de catálogo (opcionalmente filtrados por gênero / busca). */
export async function listCatalogIds(
  opts: {
    category?: SuperflixCatalogCategory;
    idType?: SuperflixIdType;
    genero?: string;
    q?: string;
    signal?: AbortSignal;
  } = {}
): Promise<string[]> {
  const category = opts.category ?? "filme";
  const idType = opts.idType ?? "imdb";
  const cacheKey = `catalog:${category}:${idType}:${opts.genero ?? ""}:${opts.q ?? ""}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const url = buildListaUrl({
    category,
    type: idType,
    genero: opts.genero,
    q: opts.q,
  });
  const raw = await fetchJson<unknown>(url, { signal: opts.signal });
  const ids = Array.isArray(raw)
    ? raw.filter((x): x is string | number => typeof x === "string" || typeof x === "number").map(String)
    : [];
  setCached(cacheKey, ids);
  return ids;
}

/** Set em memória dos IDs de filmes (IMDb e/ou TMDB) para lookup O(1). */
export async function getMovieCatalogSet(
  idType: SuperflixIdType = "imdb",
  signal?: AbortSignal
): Promise<Set<string>> {
  const cacheKey = `catalog-set:filme:${idType}`;
  const cached = getCached<Set<string>>(cacheKey);
  if (cached) return cached;

  const ids = await listCatalogIds({
    category: "filme",
    idType,
    signal,
  });
  const set = new Set(ids.map((id) => id.toLowerCase()));
  setCached(cacheKey, set);
  return set;
}

/** @deprecated Prefer getMovieCatalogSet("imdb") */
export async function getMovieImdbCatalogSet(
  signal?: AbortSignal
): Promise<Set<string>> {
  return getMovieCatalogSet("imdb", signal);
}

export async function isMovieInCatalog(
  imdbOrTmdbId: string,
  signal?: AbortSignal
): Promise<boolean> {
  const id = imdbOrTmdbId.trim().toLowerCase();
  if (!id) return false;
  const [imdbSet, tmdbSet] = await Promise.all([
    getMovieCatalogSet("imdb", signal),
    getMovieCatalogSet("tmdb", signal),
  ]);
  return imdbSet.has(id) || tmdbSet.has(id);
}

/**
 * Set unificado de TMDB IDs para série/anime/dorama
 * (player SuperFlix usa `/serie/{tmdb}` para os três).
 */
export async function getSeriesCatalogSet(
  signal?: AbortSignal
): Promise<Set<string>> {
  const cacheKey = "catalog-set:tv:tmdb";
  const cached = getCached<Set<string>>(cacheKey);
  if (cached) return cached;

  const categories: SuperflixCatalogCategory[] = ["serie", "anime", "dorama"];
  const lists = await Promise.all(
    categories.map((category) =>
      listCatalogIds({ category, idType: "tmdb", signal })
    )
  );
  const set = new Set<string>();
  for (const ids of lists) {
    for (const id of ids) set.add(id.toLowerCase());
  }
  setCached(cacheKey, set);
  return set;
}

export async function isSeriesInCatalog(
  tmdbId: string | number,
  signal?: AbortSignal
): Promise<boolean> {
  const id = String(tmdbId).trim().toLowerCase();
  if (!id) return false;
  const set = await getSeriesCatalogSet(signal);
  return set.has(id);
}

/** Categorias públicas de canais. */
export async function listChannelCategories(
  signal?: AbortSignal
): Promise<SuperflixChannelCategory[]> {
  const cacheKey = "channel-categories";
  const cached = getCached<SuperflixChannelCategory[]>(cacheKey);
  if (cached) return cached;

  const url = buildListaUrl({ category: "channel_categories" });
  const raw = await fetchJson<{
    success?: boolean;
    data?: SuperflixChannelCategory[];
  }>(url, { signal });
  const data = Array.isArray(raw?.data) ? raw.data : [];
  setCached(cacheKey, data);
  return data;
}

/** Canais ao vivo (filtro por gênero/categoria e busca). */
export async function listChannels(
  opts: {
    genre?: string;
    q?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {}
): Promise<SuperflixChannel[]> {
  const cacheKey = `channels:${opts.genre ?? ""}:${opts.q ?? ""}:${opts.limit ?? ""}`;
  const cached = getCached<SuperflixChannel[]>(cacheKey);
  if (cached) return cached;

  const url = buildListaUrl({
    category: "canais",
    genre: opts.genre,
    q: opts.q,
    limit: opts.limit,
  });
  const raw = await fetchJson<{
    success?: boolean;
    data?: SuperflixChannel[];
  }>(url, { signal: opts.signal });
  const data = Array.isArray(raw?.data)
    ? raw.data.filter((c) => c && c.is_active !== false && typeof c.embed_url === "string")
    : [];
  setCached(cacheKey, data, 15 * 60 * 1000);
  return data;
}

/** Eventos esportivos (agenda). */
export async function listEvents(
  opts: {
    sport?: string;
    status?: string;
    q?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {}
): Promise<SuperflixEvent[]> {
  const url = buildListaUrl({
    category: "eventos",
    sport: opts.sport,
    status: opts.status,
    q: opts.q,
    limit: opts.limit,
  });
  const raw = await fetchJson<{ success?: boolean; data?: SuperflixEvent[] }>(
    url,
    { signal: opts.signal }
  );
  return Array.isArray(raw?.data) ? raw.data : [];
}
