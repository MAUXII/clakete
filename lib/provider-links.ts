/**
 * TMDB/JustWatch only give a regional “watch” page link — not per-provider deep links
 * to the title. Letterboxd does (partner offers). Closest open approach: open each
 * service’s own search with the title prefilled; unknown ids fall back to TMDB link.
 *
 * `{q}` → encodeURIComponent(title)
 */

const PROVIDER_SEARCH_URLS: Record<number, string> = {
  // Global subscription
  8: "https://www.netflix.com/search?q={q}",
  9: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase={q}", // Amazon Prime (some regions)
  119: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase={q}", // Amazon Prime Video
  337: "https://www.disneyplus.com/search?q={q}",
  1899: "https://www.max.com/search?q={q}", // Max / HBO Max
  384: "https://www.max.com/search?q={q}", // legacy HBO Max id in some markets
  350: "https://tv.apple.com/search?term={q}", // Apple TV+
  531: "https://www.paramountplus.com/search/?q={q}",
  15: "https://www.hulu.com/search?q={q}",
  11: "https://mubi.com/search/films?query={q}",
  283: "https://www.crunchyroll.com/search?q={q}",
  73: "https://tubitv.com/search/{q}",
  386: "https://www.peacocktv.com/search?q={q}",

  // Stores / rent-buy
  2: "https://tv.apple.com/search?term={q}", // Apple TV
  3: "https://play.google.com/store/search?q={q}&c=movies",
  10: "https://www.amazon.com.br/s?k={q}&i=instant-video", // Amazon Video (BR-friendly)
  68: "https://www.microsoft.com/store/search/?q={q}",
  192: "https://www.youtube.com/results?search_query={q}",

  // Brasil / LATAM
  307: "https://globoplay.globo.com/busca/?q={q}", // Globoplay
  47: "https://www.looke.com.br/search?q={q}", // Looke (verify)
  167: "https://www.clarovideo.com/brasil/busca?q={q}",
  2100: "https://www.amazon.com.br/gp/video/search?phrase={q}", // Amazon channels variants if used
}

export function getProviderWatchHref(opts: {
  providerId: number
  title: string
  /** TMDB regional watch page (JustWatch-powered). */
  fallbackLink?: string | null
}): string {
  const q = opts.title.trim()
  const pattern = PROVIDER_SEARCH_URLS[opts.providerId]
  if (pattern && q.length > 0) {
    return pattern.replaceAll("{q}", encodeURIComponent(q))
  }
  if (opts.fallbackLink?.trim()) return opts.fallbackLink.trim()
  if (pattern) return pattern.replaceAll("{q}", "")
  return "#"
}
