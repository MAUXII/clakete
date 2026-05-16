import type { Json } from "@/lib/supabase/database.types"
import type { IconType } from "react-icons"
import {
  FaDiscord,
  FaEthereum,
  FaGithub,
  FaInstagram,
  FaPinterest,
  FaSoundcloud,
  FaSpotify,
  FaTelegram,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"

export const SOCIAL_PLATFORM_IDS = [
  "youtube",
  "instagram",
  "twitter",
  "discord",
  "spotify",
  "github",
  "soundcloud",
  "pinterest",
  "telegram",
  "ethereum",
] as const

export type SocialPlatformId = (typeof SOCIAL_PLATFORM_IDS)[number]

export type SocialPlatformDbColumn =
  | "instagram_url"
  | "twitter_url"
  | "spotify_url"
  | "discord_url"
  | "youtube_url"
  | "github_url"
  | "soundcloud_url"
  | "pinterest_url"
  | "telegram_url"
  | "ethereum_url"

export type SocialUrls = Partial<Record<SocialPlatformDbColumn, string | null>>

/** Per-platform visibility on public profile (stored in `home_preferences.social_display`). */
export type SocialDisplayMap = Record<SocialPlatformDbColumn, boolean>

export type SocialPlatform = {
  id: SocialPlatformId
  name: string
  prelink: string
  color: string
  dbColumn: SocialPlatformDbColumn
  icon: IconType
}

/** Platforms for film/culture profiles — handle + prelink → full URL. */
export const socialPlatforms: SocialPlatform[] = [
  {
    id: "youtube",
    name: "YouTube",
    prelink: "https://youtube.com/@",
    color: "#FF0000",
    dbColumn: "youtube_url",
    icon: FaYoutube,
  },
  {
    id: "instagram",
    name: "Instagram",
    prelink: "https://instagram.com/",
    color: "#E4405F",
    dbColumn: "instagram_url",
    icon: FaInstagram,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    prelink: "https://x.com/",
    color: "#000000",
    dbColumn: "twitter_url",
    icon: FaXTwitter,
  },
  {
    id: "discord",
    name: "Discord",
    prelink: "https://discord.gg/",
    color: "#5865F2",
    dbColumn: "discord_url",
    icon: FaDiscord,
  },
  {
    id: "spotify",
    name: "Spotify",
    prelink: "https://open.spotify.com/user/",
    color: "#1DB954",
    dbColumn: "spotify_url",
    icon: FaSpotify,
  },
  {
    id: "github",
    name: "GitHub",
    prelink: "https://github.com/",
    color: "#181717",
    dbColumn: "github_url",
    icon: FaGithub,
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    prelink: "https://soundcloud.com/",
    color: "#FF5500",
    dbColumn: "soundcloud_url",
    icon: FaSoundcloud,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    prelink: "https://pinterest.com/",
    color: "#E60023",
    dbColumn: "pinterest_url",
    icon: FaPinterest,
  },
  {
    id: "telegram",
    name: "Telegram",
    prelink: "https://t.me/",
    color: "#0088CC",
    dbColumn: "telegram_url",
    icon: FaTelegram,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    prelink: "https://etherscan.io/address/",
    color: "#627EEA",
    dbColumn: "ethereum_url",
    icon: FaEthereum,
  },
]

export function socialUrlForPlatform(urls: SocialUrls, platform: SocialPlatform): string | null {
  const value = urls[platform.dbColumn]
  return value?.trim() ? value.trim() : null
}

/** Build a full profile URL from a handle, or null if empty. */
export function buildSocialUrl(prelink: string, handle: string): string | null {
  const trimmed = handle.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("www.")) {
    const parsed = parseHandleFromUrl(prelink, trimmed)
    if (!parsed) return null
    return `${prelink}${parsed.replace(/^@+/, "").replace(/\/+$/, "")}`
  }

  const handleOnly = trimmed.replace(/^@+/, "").replace(/\/+$/, "")
  if (!handleOnly) return null
  return `${prelink}${handleOnly}`
}

/** Extract handle/username from a stored URL or pasted link. */
export function parseHandleFromUrl(prelink: string, url: string | null | undefined): string {
  if (!url?.trim()) return ""

  const raw = url.trim()
  const preLower = prelink.toLowerCase()

  if (raw.toLowerCase().startsWith(preLower)) {
    return raw
      .slice(prelink.length)
      .replace(/^\/+/, "")
      .split(/[?#]/)[0]
      .replace(/\/+$/, "")
  }

  try {
    const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const parsed = new URL(href)
    const pathname = parsed.pathname

    if (preLower.includes("youtube.com")) {
      const atMatch = pathname.match(/@([^/?#]+)/)
      if (atMatch?.[1]) return atMatch[1]
    }

    if (preLower.includes("open.spotify.com")) {
      const segments = pathname.split("/").filter(Boolean)
      const userIdx = segments.indexOf("user")
      if (userIdx >= 0 && segments[userIdx + 1]) {
        return segments[userIdx + 1]
      }
    }

    if (preLower.includes("discord.gg") || preLower.includes("discord.com")) {
      const invite = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]
      if (invite) return invite
    }

    if (preLower.includes("github.com")) {
      const user = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]
      if (user) return user
    }

    if (preLower.includes("soundcloud.com")) {
      const user = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]
      if (user) return user
    }

    if (preLower.includes("pinterest.com")) {
      const user = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]
      if (user) return user
    }

    if (preLower.includes("t.me") || preLower.includes("telegram.me")) {
      const user = pathname.replace(/^\/+/, "").split(/[/?#]/)[0]
      if (user) return user
    }

    if (preLower.includes("etherscan.io")) {
      const segments = pathname.split("/").filter(Boolean)
      const addrIdx = segments.indexOf("address")
      if (addrIdx >= 0 && segments[addrIdx + 1]) {
        return segments[addrIdx + 1]
      }
    }

    let path = pathname.replace(/^\/+/, "").split(/[?#]/)[0].replace(/\/$/, "")
    if (path.startsWith("@")) path = path.slice(1)
    if (path) return path.includes("/") ? (path.split("/").pop() ?? path) : path

    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return raw.replace(/^@+/, "").replace(/\/+$/, "")
  }
}

export function emptySocialUrls(): SocialUrls {
  return {
    instagram_url: null,
    twitter_url: null,
    spotify_url: null,
    discord_url: null,
    youtube_url: null,
    github_url: null,
    soundcloud_url: null,
    pinterest_url: null,
    telegram_url: null,
    ethereum_url: null,
  }
}

export function defaultSocialDisplayMap(): SocialDisplayMap {
  return {
    instagram_url: true,
    twitter_url: true,
    spotify_url: true,
    discord_url: true,
    youtube_url: true,
    github_url: true,
    soundcloud_url: true,
    pinterest_url: true,
    telegram_url: true,
    ethereum_url: true,
  }
}

export function parseSocialDisplay(raw: Json | null | undefined): SocialDisplayMap {
  const base = defaultSocialDisplayMap()
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base
  const root = raw as Record<string, unknown>
  const stored = root.social_display
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return base
  const map = stored as Record<string, unknown>
  for (const platform of socialPlatforms) {
    const value = map[platform.dbColumn]
    if (typeof value === "boolean") base[platform.dbColumn] = value
  }
  return base
}

export function mergeSocialDisplayIntoPreferencesJson(
  prefsJson: Json,
  display: SocialDisplayMap,
): Json {
  const o =
    prefsJson && typeof prefsJson === "object" && !Array.isArray(prefsJson)
      ? { ...(prefsJson as Record<string, unknown>) }
      : {}
  o.social_display = { ...display }
  return o as Json
}

export function isSocialVisibleOnProfile(
  display: SocialDisplayMap,
  platform: SocialPlatform,
): boolean {
  return display[platform.dbColumn] ?? true
}

export type ProfileSocialLink = {
  platform: SocialPlatform
  url: string
}

/** Links with URL set and "Display on profile" enabled. */
export function getVisibleProfileSocialLinks(
  record: Parameters<typeof socialUrlsFromRecord>[0],
  homePreferences: Json | null | undefined,
): ProfileSocialLink[] {
  const urls = socialUrlsFromRecord(record)
  const display = parseSocialDisplay(homePreferences)

  return socialPlatforms.flatMap((platform) => {
    const url = socialUrlForPlatform(urls, platform)
    if (!url || !isSocialVisibleOnProfile(display, platform)) return []
    return [{ platform, url }]
  })
}

export function socialUrlsFromRecord(record: {
  instagram_url?: string | null
  twitter_url?: string | null
  spotify_url?: string | null
  discord_url?: string | null
  youtube_url?: string | null
  github_url?: string | null
  soundcloud_url?: string | null
  pinterest_url?: string | null
  telegram_url?: string | null
  ethereum_url?: string | null
}): SocialUrls {
  return {
    instagram_url: record.instagram_url ?? null,
    twitter_url: record.twitter_url ?? null,
    spotify_url: record.spotify_url ?? null,
    discord_url: record.discord_url ?? null,
    youtube_url: record.youtube_url ?? null,
    github_url: record.github_url ?? null,
    soundcloud_url: record.soundcloud_url ?? null,
    pinterest_url: record.pinterest_url ?? null,
    telegram_url: record.telegram_url ?? null,
    ethereum_url: record.ethereum_url ?? null,
  }
}
