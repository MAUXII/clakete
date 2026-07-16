/**
 * Unofficial JustWatch GraphQL (same surface the website uses).
 * Letterboxd gets official partner deep links; this is the practical open alternative.
 * May break if JW changes the API — always keep search-URL fallbacks.
 */

export type JustWatchMediaType = "movie" | "tv"

type JwLocale = { country: string; language: string }

const REGION_TO_JW: Record<string, JwLocale> = {
  BR: { country: "BR", language: "pt" },
  US: { country: "US", language: "en" },
  PT: { country: "PT", language: "pt" },
  MX: { country: "MX", language: "es" },
  AR: { country: "AR", language: "es" },
  ES: { country: "ES", language: "es" },
  GB: { country: "GB", language: "en" },
}

export function justWatchLocaleForRegion(region: string): JwLocale {
  const key = region.trim().toUpperCase()
  return REGION_TO_JW[key] ?? { country: key || "BR", language: "en" }
}

type GraphQlResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

async function jwGraphql<T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  const res = await fetch("https://apis.justwatch.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "app-version": "3.8.1-web-web",
      referer: "https://www.justwatch.com/",
    },
    body: JSON.stringify({ operationName, query, variables }),
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    console.error("JustWatch GraphQL HTTP", res.status)
    return null
  }

  const json = (await res.json()) as GraphQlResponse<T>
  if (json.errors?.length) {
    console.error("JustWatch GraphQL errors", json.errors)
    return null
  }
  return json.data ?? null
}

type SearchNode = {
  id: string
  objectType: string
  content?: {
    title?: string
    externalIds?: { tmdbId?: string | null; imdbId?: string | null }
  }
}

const SEARCH_QUERY = `
query GetSuggestedTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
  popularTitles(country: $country, first: $first, filter: $filter) {
    edges {
      node {
        id
        objectType
        content(country: $country, language: $language) {
          title
          externalIds { imdbId tmdbId }
        }
      }
    }
  }
}
`

async function findJustWatchNodeId(opts: {
  tmdbId: number
  mediaType: JustWatchMediaType
  country: string
  language: string
  titleHint?: string
}): Promise<string | null> {
  const wantType = opts.mediaType === "tv" ? "SHOW" : "MOVIE"
  const tmdbStr = String(opts.tmdbId)
  const queryText = (opts.titleHint?.trim() || tmdbStr).slice(0, 80)

  const data = await jwGraphql<{
    popularTitles?: { edges?: Array<{ node?: SearchNode }> }
  }>("GetSuggestedTitles", SEARCH_QUERY, {
    country: opts.country,
    language: opts.language,
    first: 8,
    filter: { searchQuery: queryText },
  })

  const edges = data?.popularTitles?.edges ?? []
  const match = edges.find((e) => {
    const n = e.node
    if (!n) return false
    if (n.objectType !== wantType) return false
    return n.content?.externalIds?.tmdbId === tmdbStr
  })

  return match?.node?.id ?? null
}

type JwOffer = {
  monetizationType?: string
  standardWebURL?: string | null
  package?: { packageId?: number; clearName?: string }
}

const OFFERS_QUERY = `
query GetTitleOffers(
  $nodeId: ID!
  $country: Country!
  $platform: Platform! = WEB
  $filterFlatrate: OfferFilter!
  $filterBuy: OfferFilter!
  $filterRent: OfferFilter!
) {
  node(id: $nodeId) {
    ... on MovieOrShowOrSeasonOrEpisode {
      flatrate: offers(country: $country, platform: $platform, filter: $filterFlatrate) {
        monetizationType
        standardWebURL
        package { packageId clearName }
      }
      buy: offers(country: $country, platform: $platform, filter: $filterBuy) {
        monetizationType
        standardWebURL
        package { packageId clearName }
      }
      rent: offers(country: $country, platform: $platform, filter: $filterRent) {
        monetizationType
        standardWebURL
        package { packageId clearName }
      }
    }
  }
}
`

function collectOfferUrls(buckets: Array<JwOffer[] | undefined | null>): Record<number, string> {
  const out: Record<number, string> = {}
  for (const list of buckets) {
    for (const offer of list ?? []) {
      const id = offer.package?.packageId
      const url = offer.standardWebURL?.trim()
      if (!id || !url || out[id]) continue
      out[id] = url
    }
  }
  return out
}

/**
 * Map TMDB provider_id → deep link to the title on that service (when JustWatch has one).
 */
export async function fetchProviderDeepLinks(opts: {
  tmdbId: number
  mediaType: JustWatchMediaType
  region: string
  titleHint?: string
}): Promise<{ links: Record<number, string>; justWatchPath?: string | null }> {
  const locale = justWatchLocaleForRegion(opts.region)
  const nodeId = await findJustWatchNodeId({
    tmdbId: opts.tmdbId,
    mediaType: opts.mediaType,
    country: locale.country,
    language: locale.language,
    titleHint: opts.titleHint,
  })

  if (!nodeId) {
    return { links: {} }
  }

  const data = await jwGraphql<{
    node?: {
      flatrate?: JwOffer[]
      buy?: JwOffer[]
      rent?: JwOffer[]
    }
  }>("GetTitleOffers", OFFERS_QUERY, {
    nodeId,
    country: locale.country,
    platform: "WEB",
    filterFlatrate: {
      monetizationTypes: ["FLATRATE", "FLATRATE_AND_BUY", "ADS", "FREE"],
    },
    filterBuy: { monetizationTypes: ["BUY"] },
    filterRent: { monetizationTypes: ["RENT"] },
  })

  return {
    links: collectOfferUrls([data?.node?.flatrate, data?.node?.buy, data?.node?.rent]),
  }
}
