/** Default Clakete brand accent (#FF0048). */
export const DEFAULT_BRAND_HEX = "#FF0048"

const HEX_RE = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i

export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null
  let s = input.trim()
  if (!s.startsWith("#")) s = `#${s}`
  if (!HEX_RE.test(s)) return null
  if (s.length === 4) {
    const r = s[1]!
    const g = s[2]!
    const b = s[3]!
    s = `#${r}${r}${g}${g}${b}${b}`
  }
  return s.toUpperCase()
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return {
    r: Number.parseInt(n.slice(1, 3), 16),
    g: Number.parseInt(n.slice(3, 5), 16),
    b: Number.parseInt(n.slice(5, 7), 16),
  }
}

/** HSL channels without unit — fits `hsl(var(--brand) / <alpha>)`. */
export function hexToHslChannels(hex: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  const H = Math.round(h * 360)
  const S = Math.round(s * 100)
  const L = Math.round(l * 100)
  return `${H} ${S}% ${L}%`
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

/** Darken/lighten hex by mixing toward black/white (Discord-style tone). */
export function mixHex(hex: string, toward: "black" | "white", amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return DEFAULT_BRAND_HEX
  const t = toward === "white" ? 255 : 0
  const a = clamp01(amount)
  const mix = (c: number) => Math.round(c + (t - c) * a)
  const to = (n: number) => n.toString(16).padStart(2, "0")
  return `#${to(mix(rgb.r))}${to(mix(rgb.g))}${to(mix(rgb.b))}`.toUpperCase()
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const r = lin(rgb.r)
  const g = lin(rgb.g)
  const b = lin(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Foreground that contrasts on the accent (white or near-black). */
export function brandForegroundHex(accent: string): string {
  return relativeLuminance(accent) > 0.55 ? "#111111" : "#FFFFFF"
}

export interface BrandAccentTokens {
  hex: string
  hsl: string
  hoverHex: string
  hoverHsl: string
  mutedHex: string
  mutedHsl: string
  lightHex: string
  lightHsl: string
  foregroundHex: string
}

export function buildBrandTokens(hexInput: string): BrandAccentTokens {
  const hex = normalizeHex(hexInput) ?? DEFAULT_BRAND_HEX
  const hoverHex = mixHex(hex, "black", 0.12)
  const mutedHex = mixHex(hex, "white", 0.28)
  const lightHex = mixHex(hex, "white", 0.45)
  return {
    hex,
    hsl: hexToHslChannels(hex) ?? "347 100% 50%",
    hoverHex,
    hoverHsl: hexToHslChannels(hoverHex) ?? "347 100% 44%",
    mutedHex,
    mutedHsl: hexToHslChannels(mutedHex) ?? "347 70% 64%",
    lightHex,
    lightHsl: hexToHslChannels(lightHex) ?? "347 100% 78%",
    foregroundHex: brandForegroundHex(hex),
  }
}

export function applyBrandTokensToDocument(tokens: BrandAccentTokens) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--brand", tokens.hsl)
  root.style.setProperty("--brand-hover", tokens.hoverHsl)
  root.style.setProperty("--brand-muted", tokens.mutedHsl)
  root.style.setProperty("--brand-light", tokens.lightHsl)
  root.style.setProperty("--brand-hex", tokens.hex)
  root.style.setProperty("--brand-foreground", tokens.foregroundHex)
  // Focus rings follow accent (Discord-like).
  root.style.setProperty("--ring", tokens.hsl)
}

export const BRAND_STORAGE_KEY = "clakete.brand-accent"

export const BRAND_PRESETS = [
  { id: "clakete", label: "Clakete", hex: DEFAULT_BRAND_HEX },
  { id: "noir", label: "Noir", hex: "#A8B0B8" },
  { id: "overlook", label: "Overlook", hex: "#C9A227" },
  { id: "rose", label: "Rose", hex: "#E8486B" },
  { id: "violet", label: "Violet", hex: "#8B5CF6" },
  { id: "ocean", label: "Ocean", hex: "#0EA5E9" },
] as const
