/**
 * Hub / cover atmosphere presets — ported from Rorscharch (`cover-atmo.ts`).
 * Viewer preference: how every Glass profile (and shared wash) looks.
 */

export type AtmosphereMode = "off" | "light" | "soft" | "medium" | "vivid"

export type AtmosphereSource = "banner" | "avatar"

/** Glass profile banner chrome. */
export type GlassBannerLayout = "contained" | "full"

export const DEFAULT_ATMOSPHERE_MODE: AtmosphereMode = "vivid"
export const DEFAULT_ATMOSPHERE_SOURCE: AtmosphereSource = "banner"
export const DEFAULT_GLASS_BANNER_LAYOUT: GlassBannerLayout = "contained"

export function isAtmosphereMode(v: unknown): v is AtmosphereMode {
  return (
    v === "off" ||
    v === "light" ||
    v === "soft" ||
    v === "medium" ||
    v === "vivid"
  )
}

export function isAtmosphereSource(v: unknown): v is AtmosphereSource {
  return v === "banner" || v === "avatar"
}

export function isGlassBannerLayout(v: unknown): v is GlassBannerLayout {
  return v === "contained" || v === "full"
}

export function normalizeAtmosphereMode(value: unknown): AtmosphereMode {
  if (isAtmosphereMode(value)) return value
  if (value === "subtle") return "light"
  return DEFAULT_ATMOSPHERE_MODE
}

export function normalizeAtmosphereSource(value: unknown): AtmosphereSource {
  if (isAtmosphereSource(value)) return value
  return DEFAULT_ATMOSPHERE_SOURCE
}

export function normalizeGlassBannerLayout(value: unknown): GlassBannerLayout {
  if (isGlassBannerLayout(value)) return value
  return DEFAULT_GLASS_BANNER_LAYOUT
}

/** Leitour / vivid full-page fade. */
export const LEITOUR_ATMO_FADE =
  "linear-gradient(180deg, #000 0%, #000 22%, rgba(0,0,0,0.55) 48%, transparent 82%)"

export type AtmospherePreset = {
  opacity: number
  blurPx: number
  top: string
  height: string
  width: string
  scale: number
  showTintBg: boolean
  maskImage: string
  washGradient: string
  clipHeight?: string
  anchor: "left" | "center"
  left?: string
}

/**
 * light   = cantinho esquerdo
 * soft    = largura total, dissolve ~metade
 * medium  = mais cor, desce ~70%
 * vivid   = Leitour sala / perfil — página inteira
 */
export const ATMOSPHERE_PRESETS: Record<
  Exclude<AtmosphereMode, "off">,
  AtmospherePreset
> = {
  light: {
    opacity: 0.2,
    blurPx: 68,
    top: "-6%",
    left: "-14%",
    height: "44vh",
    width: "58vw",
    scale: 1.05,
    showTintBg: false,
    anchor: "left",
    clipHeight: "36vh",
    maskImage:
      "radial-gradient(ellipse 90% 75% at 14% 8%, #000 0%, rgba(0,0,0,0.55) 38%, transparent 72%)",
    washGradient:
      "linear-gradient(180deg, transparent 0%, rgba(21,22,24,0.35) 18%, #151618 34%, #151618 100%)",
  },
  soft: {
    opacity: 0.4,
    blurPx: 76,
    top: "-10%",
    height: "58vh",
    width: "100vw",
    scale: 1,
    showTintBg: false,
    anchor: "center",
    clipHeight: "50vh",
    maskImage:
      "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.78) 14%, rgba(0,0,0,0.28) 36%, transparent 54%)",
    washGradient:
      "linear-gradient(180deg, transparent 0%, rgba(21,22,24,0.42) 22%, #151618 44%, #151618 100%)",
  },
  medium: {
    opacity: 0.52,
    blurPx: 92,
    top: "-14%",
    height: "78vh",
    width: "130vw",
    scale: 1.06,
    showTintBg: true,
    anchor: "center",
    clipHeight: "72vh",
    maskImage:
      "linear-gradient(180deg, #000 0%, #000 12%, rgba(0,0,0,0.65) 38%, rgba(0,0,0,0.2) 62%, transparent 78%)",
    washGradient:
      "linear-gradient(180deg, rgba(21,22,24,0.12) 0%, rgba(21,22,24,0.48) 35%, #151618 62%, #151618 100%)",
  },
  vivid: {
    opacity: 0.7,
    blurPx: 110,
    top: "-20%",
    height: "110vh",
    width: "170vw",
    scale: 1.1,
    showTintBg: true,
    anchor: "center",
    maskImage: LEITOUR_ATMO_FADE,
    washGradient:
      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.45) 100%)",
  },
}

export const ATMOSPHERE_MODE_OPTIONS: {
  id: AtmosphereMode
  labelKey: string
  hintKey: string
}[] = [
  { id: "off", labelKey: "prefs.atmoOff", hintKey: "prefs.atmoOffHint" },
  { id: "light", labelKey: "prefs.atmoLight", hintKey: "prefs.atmoLightHint" },
  { id: "soft", labelKey: "prefs.atmoSoft", hintKey: "prefs.atmoSoftHint" },
  { id: "medium", labelKey: "prefs.atmoMedium", hintKey: "prefs.atmoMediumHint" },
  { id: "vivid", labelKey: "prefs.atmoVivid", hintKey: "prefs.atmoVividHint" },
]

/** Resolve which image feeds the wash given viewer prefs + available media. */
export function resolveAtmosphereCoverUrl(opts: {
  source: AtmosphereSource
  bannerUrl: string | null | undefined
  avatarUrl: string | null | undefined
  /** Owner actually shows a banner strip (Shining + prefs + asset). */
  bannerVisible: boolean
}): string | null {
  const banner = opts.bannerUrl?.trim() || null
  const avatar = opts.avatarUrl?.trim() || null
  const canUseBanner = Boolean(opts.bannerVisible && banner)

  if (opts.source === "banner" && canUseBanner) return banner
  if (opts.source === "avatar" && avatar) return avatar
  if (canUseBanner) return banner
  if (avatar) return avatar
  return null
}
