/**
 * Fontes de embed que só precisam do ID TMDB do filme.
 * URLs “estranhas” (watch.brstream.cc, hglink, etc.) entram via
 * FILM_SOURCE_IFRAME_OVERRIDES_JSON no servidor.
 */

export type IframePlaybackSource = {
  id: string;
  label: string;
  url: string;
};

const EMBED_SUFFIX = "#noEpList#noLink";

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

export function buildDefaultIframeSources(tmdbId: number): IframePlaybackSource[] {
  const id = String(tmdbId);
  return [
    {
      id: "superflix-cv",
      label: "SuperFlix (.cv)",
      url: `https://superflixapi.cv/filme/${id}/${EMBED_SUFFIX}`,
    },
    {
      id: "superflix-rest",
      label: "SuperFlix (REST)",
      url: `https://superflixapi.rest/filme/${id}/${EMBED_SUFFIX}`,
    },
    {
      id: "playerflix",
      label: "PlayerFlix",
      url: `https://playerflixapi.com/filme/${id}/${EMBED_SUFFIX}`,
    },
    {
      id: "fshd",
      label: "fshd.link",
      url: `https://fshd.link/filme/${id}/${EMBED_SUFFIX}`,
    },
    {
      id: "vidsrc-pt",
      label: "VidSrc (PT)",
      url: `https://vidsrc.net/embed/movie?tmdb=${id}&ds_lang=pt`,
    },
  ];
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
 * {"1368166":[{"id":"brstream","label":"watch.brstream.cc","url":"https://watch.brstream.cc/watch?v=7V3Y1U0Z"}]}
 *
 * Forma alternativa (sem label): {"1368166":{"brstream":"https://..."}}
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

export function mergeIframeSources(
  tmdbId: number,
  filmId: string
): IframePlaybackSource[] {
  const defaults = buildDefaultIframeSources(tmdbId);
  const overrides = parseIframeOverridesForFilm(filmId);
  const map = new Map<string, IframePlaybackSource>();
  for (const s of defaults) map.set(s.id, s);
  for (const s of overrides) map.set(s.id, s);
  return [...map.values()];
}
