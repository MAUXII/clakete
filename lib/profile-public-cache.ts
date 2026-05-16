import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image"

export type ProfileStatsSnapshot = {
  filmsCount: number
  seriesCount: number
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

export type CachedPublicProfile = {
  user: {
    id: string
    username: string
    display_name?: string
    bio?: string
    avatar_url?: string | null
    banner_url?: string | null
    website_url?: string | null
    twitter_url?: string | null
    instagram_url?: string | null
    spotify_url?: string | null
    discord_url?: string | null
    youtube_url?: string | null
    github_url?: string | null
    soundcloud_url?: string | null
    pinterest_url?: string | null
    telegram_url?: string | null
    ethereum_url?: string | null
    avatar_meta?: TmdbStoredImageMeta | null
    banner_meta?: TmdbStoredImageMeta | null
  }
  isOwnProfile: boolean
  stats: ProfileStatsSnapshot
  fetchedAt: number
}

const STORAGE_PREFIX = "clakete_profile_cache:"
const TTL_MS = 5 * 60 * 1000

const memory = new Map<string, CachedPublicProfile>()

function normKey(username: string) {
  return username.toLowerCase()
}

export function readPublicProfileCache(username: string): CachedPublicProfile | null {
  const key = normKey(username)
  const fromMem = memory.get(key)
  if (fromMem && Date.now() - fromMem.fetchedAt < TTL_MS) return fromMem

  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedPublicProfile
    if (Date.now() - parsed.fetchedAt >= TTL_MS) {
      sessionStorage.removeItem(STORAGE_PREFIX + key)
      return null
    }
    memory.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

export function writePublicProfileCache(username: string, entry: CachedPublicProfile): void {
  const key = normKey(username)
  memory.set(key, entry)
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota / private mode */
  }
}

export function invalidatePublicProfileCache(username?: string): void {
  if (username) {
    const key = normKey(username)
    memory.delete(key)
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(STORAGE_PREFIX + key)
      } catch {
        /* ignore */
      }
    }
    return
  }

  memory.clear()
  if (typeof window === "undefined") return
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const sk = sessionStorage.key(i)
      if (sk?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(sk)
    }
  } catch {
    /* ignore */
  }
}
