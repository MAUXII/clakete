import type {
  DisplayScale,
  FilmExternalRating,
  MdbListMediaType,
  MdbListRatingSourceId,
  MdbListRawRating,
  MdbListTitleResponse,
} from "./types";

const MDBLIST_BASE = "https://api.mdblist.com";

/** Fontes exibidas na UI. */
export const RATING_DISPLAY_ORDER: MdbListRatingSourceId[] = [
  "imdb",
  "tomatoes",
  "popcorn",
  "metacritic",
  "letterboxd",
  "tmdb",
  "trakt",
];

const SOURCE_ALIASES: Record<string, MdbListRatingSourceId> = {
  imdb: "imdb",
  tomatoes: "tomatoes",
  tomato: "tomatoes",
  "rotten tomatoes": "tomatoes",
  rottentomatoes: "tomatoes",
  rt: "tomatoes",
  popcorn: "popcorn",
  audience: "popcorn",
  "rotten tomatoes audience": "popcorn",
  metacritic: "metacritic",
  meta: "metacritic",
  letterboxd: "letterboxd",
  lb: "letterboxd",
  trakt: "trakt",
  tmdb: "tmdb",
  "themoviedb": "tmdb",
};

const SOURCE_LABELS: Record<MdbListRatingSourceId, string> = {
  imdb: "IMDb",
  tomatoes: "Critics",
  popcorn: "Audience",
  metacritic: "Metacritic",
  letterboxd: "Letterboxd",
  trakt: "Trakt",
  tmdb: "TMDb",
};

export class MdbListApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "MdbListApiError";
    this.status = status;
  }
}

type CacheEntry<T> = { value: T; expiresAt: number };

/** Cache em memória (L1) — ratings mudam pouco; TTL longo poupa a cota da API. */
const memoryCache = new Map<string, CacheEntry<unknown>>();
/** 7 dias — scores externos não precisam de frescor horário. */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Revalidate do fetch do Next (persistente entre requests no mesmo processo/deploy). */
export const MDBLIST_REVALIDATE_SECONDS = 7 * 24 * 60 * 60;

function getCached<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function toNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || /^n\/?a$/i.test(s)) return null;
    const n = Number(s.replace("%", ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeSource(raw: string | null | undefined): MdbListRatingSourceId | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return SOURCE_ALIASES[key] ?? null;
}

/**
 * MDBList mistura escalas em `value`:
 * - IMDb: 8.8 (0–10)
 * - Trakt/TMDb: 87 / 84 (0–100, mesmo com label /10)
 * - RT/Metacritic: 81 (0–100)
 * - Letterboxd: 4.3 (0–5)
 * `score` costuma espelhar o percentual 0–100.
 */
function resolveNativeValue(
  id: MdbListRatingSourceId,
  rawValue: number,
  score100: number | null
): { value: number; display: string; scale: DisplayScale } {
  switch (id) {
    case "tomatoes":
    case "popcorn": {
      let pct = rawValue > 10 ? rawValue : score100 != null ? score100 : rawValue * 10;
      pct = Math.min(100, Math.max(0, Math.round(pct)));
      return { value: pct, display: `${pct}%`, scale: "percent" };
    }
    case "metacritic": {
      let meta = rawValue > 10 ? rawValue : score100 != null ? score100 : rawValue * 10;
      meta = Math.min(100, Math.max(0, Math.round(meta)));
      return { value: meta, display: `${meta}/100`, scale: "100" };
    }
    case "letterboxd": {
      let stars = rawValue;
      if (stars > 10) stars = (score100 != null ? score100 : stars) / 20;
      else if (stars > 5) stars = stars / 2;
      stars = Math.min(5, Math.max(0, stars));
      return { value: stars, display: `${stars.toFixed(1)}/5`, scale: "5" };
    }
    case "imdb":
    case "trakt":
    case "tmdb":
    default: {
      // Sempre normaliza para 0–10. Trakt/TMDb costumam vir 0–100.
      let ten = rawValue;
      if (ten > 10 && ten <= 100) ten = ten / 10;
      else if (ten > 100 && score100 != null) ten = score100 / 10;
      else if (ten > 100) ten = ten / 100;
      else if (ten <= 0 && score100 != null) ten = score100 / 10;
      // Se ainda estiver absurdo (ex.: score também inflado), força /10 de novo.
      if (ten > 10) ten = ten / 10;
      ten = Math.min(10, Math.max(0, ten));
      return { value: ten, display: `${ten.toFixed(1)}/10`, scale: "10" };
    }
  }
}

function buildProviderHref(
  id: MdbListRatingSourceId,
  ids: { imdb?: string | null; tmdb?: number | null },
  rawUrl: unknown
): string | null {
  if (typeof rawUrl === "string" && /^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const imdb = ids.imdb?.trim();
  const tmdb = ids.tmdb;

  switch (id) {
    case "imdb":
      return imdb ? `https://www.imdb.com/title/${imdb}/` : null;
    case "tmdb":
      return tmdb ? `https://www.themoviedb.org/movie/${tmdb}` : null;
    case "letterboxd":
      return imdb ? `https://letterboxd.com/imdb/${imdb}/` : null;
    case "trakt":
      return tmdb ? `https://trakt.tv/search/tmdb/${tmdb}?id_type=movie` : null;
    case "metacritic":
    case "tomatoes":
    case "popcorn":
    default:
      return null;
  }
}

/** Normaliza o array cru do MDBList para a UI. */
export function normalizeFilmRatings(
  data: MdbListTitleResponse | null | undefined,
  tmdbId: number
): FilmExternalRating[] {
  if (!data || !Array.isArray(data.ratings)) return [];

  const ids = {
    imdb: typeof data.ids?.imdb === "string" ? data.ids.imdb : null,
    tmdb:
      typeof data.ids?.tmdb === "number"
        ? data.ids.tmdb
        : toNumber(data.ids?.tmdb) ?? tmdbId,
  };

  const byId = new Map<MdbListRatingSourceId, FilmExternalRating>();

  for (const raw of data.ratings as MdbListRawRating[]) {
    const id = normalizeSource(raw.source ?? null);
    if (!id) continue;

    const rawValue = toNumber(raw.value);
    const score100 = toNumber(raw.score);
    if ((rawValue == null || rawValue <= 0) && (score100 == null || score100 <= 0)) {
      continue;
    }

    const resolved = resolveNativeValue(
      id,
      rawValue != null && rawValue > 0 ? rawValue : (score100 as number),
      score100
    );
    if (resolved.value <= 0) continue;

    const votes = toNumber(raw.votes);
    const certifiedFresh =
      id === "tomatoes" &&
      (raw.fresh === 1 || raw.fresh === true || raw.fresh === "1");

    byId.set(id, {
      id,
      label: SOURCE_LABELS[id],
      value: resolved.value,
      score100,
      votes: votes != null ? Math.round(votes) : null,
      display: resolved.display,
      scale: resolved.scale,
      href: buildProviderHref(id, ids, raw.url),
      certifiedFresh: certifiedFresh || undefined,
    });
  }

  return RATING_DISPLAY_ORDER.map((id) => byId.get(id)).filter(
    (r): r is FilmExternalRating => Boolean(r)
  );
}

export type FetchMdbListOptions = {
  mediaType?: MdbListMediaType;
  signal?: AbortSignal;
  /** TTL do cache em ms (default 7d). */
  cacheTtlMs?: number;
  /** Pula cache (útil em debug). */
  skipCache?: boolean;
};

/**
 * Busca metadados/ratings no MDBList por TMDB id.
 * Exige `MDBLIST_API_KEY` no ambiente do servidor.
 */
export async function fetchMdbListByTmdb(
  tmdbId: number,
  opts: FetchMdbListOptions = {}
): Promise<MdbListTitleResponse | null> {
  const apiKey = process.env.MDBLIST_API_KEY?.trim();
  if (!apiKey) {
    throw new MdbListApiError("MDBLIST_API_KEY não configurada");
  }

  if (!Number.isFinite(tmdbId) || tmdbId < 1) {
    throw new MdbListApiError("TMDB id inválido", 400);
  }

  const mediaType = opts.mediaType ?? "movie";
  const cacheKey = `mdblist:v4:${mediaType}:${tmdbId}`;

  if (!opts.skipCache) {
    const cached = getCached<MdbListTitleResponse | null>(cacheKey);
    if (cached !== null || memoryCache.has(cacheKey)) {
      return cached;
    }
  }

  const url = `${MDBLIST_BASE}/tmdb/${mediaType}/${tmdbId}?apikey=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      // skipCache = refresh forçado (ex.: miss no Supabase).
      ...(opts.skipCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: MDBLIST_REVALIDATE_SECONDS } }),
    });

    if (res.status === 404) {
      setCached(cacheKey, null, opts.cacheTtlMs);
      return null;
    }

    if (!res.ok) {
      throw new MdbListApiError(`MDBList respondeu ${res.status}`, res.status);
    }

    const data = (await res.json()) as MdbListTitleResponse;
    setCached(cacheKey, data, opts.cacheTtlMs);
    return data;
  } catch (err) {
    if (err instanceof MdbListApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new MdbListApiError("Timeout ao contactar MDBList");
    }
    throw new MdbListApiError(
      err instanceof Error ? err.message : "Erro de rede MDBList"
    );
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

export async function getFilmExternalRatings(
  tmdbId: number,
  opts?: FetchMdbListOptions
): Promise<FilmExternalRating[]> {
  const data = await fetchMdbListByTmdb(tmdbId, opts);
  return normalizeFilmRatings(data, tmdbId);
}
