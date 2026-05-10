import type { Area } from "react-easy-crop"
import type { TmdbStoredImageMeta } from "@/types/tmdb-stored-image"

export function tmdbOriginalSrc(filePath: string): string {
  const p = filePath.startsWith("/") ? filePath : `/${filePath}`
  return `https://image.tmdb.org/t/p/original${p}`
}

/** Valida JSON vindo da base (listas ou perfil). */
export function parseTmdbStoredImageMeta(raw: unknown): TmdbStoredImageMeta | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  if (o.provider !== "tmdb" || typeof o.file_path !== "string") return null
  if (!o.file_path.trim()) return null
  const c = o.crop
  if (!c || typeof c !== "object") return null
  const crop = c as Record<string, unknown>
  if (
    typeof crop.x !== "number" ||
    typeof crop.y !== "number" ||
    typeof crop.w !== "number" ||
    typeof crop.h !== "number"
  )
    return null
  return {
    provider: "tmdb",
    file_path: o.file_path,
    crop: { x: crop.x, y: crop.y, w: crop.w, h: crop.h },
  }
}

export function buildTmdbStoredImageMeta(
  tmdbFilePath: string,
  pixelCrop: Area,
  imageWidth: number,
  imageHeight: number,
): TmdbStoredImageMeta {
  const w = Math.max(1e-9, imageWidth)
  const h = Math.max(1e-9, imageHeight)
  const fp = tmdbFilePath.trim().startsWith("/") ? tmdbFilePath.trim() : `/${tmdbFilePath.trim()}`
  return {
    provider: "tmdb",
    file_path: fp,
    crop: {
      x: Math.min(1, Math.max(0, pixelCrop.x / w)),
      y: Math.min(1, Math.max(0, pixelCrop.y / h)),
      w: Math.min(1, Math.max(1e-6, pixelCrop.width / w)),
      h: Math.min(1, Math.max(1e-6, pixelCrop.height / h)),
    },
  }
}

/** URL TMDB original + foco CSS (object-position / background-position). */
export function tmdbStoredImagePresentation(meta: TmdbStoredImageMeta | null | undefined): {
  src: string
  objectPosition: string
} | null {
  if (!meta?.file_path || meta.provider !== "tmdb") return null
  const cx = meta.crop.x + meta.crop.w / 2
  const cy = meta.crop.y + meta.crop.h / 2
  return {
    src: tmdbOriginalSrc(meta.file_path),
    objectPosition: `${cx * 100}% ${cy * 100}%`,
  }
}
