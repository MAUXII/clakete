import type { Area } from "react-easy-crop"
import type { List, ListBannerMeta } from "@/types/list"
import { listBackdropImageSrc } from "@/lib/list-href"
import {
  buildTmdbStoredImageMeta,
  parseTmdbStoredImageMeta,
  tmdbOriginalSrc,
} from "@/lib/tmdb-stored-image"

/** @deprecated Prefer `parseTmdbStoredImageMeta` */
export function parseListBannerMeta(raw: unknown): ListBannerMeta | null {
  return parseTmdbStoredImageMeta(raw)
}

/** @deprecated Prefer `buildTmdbStoredImageMeta` */
export function buildListBannerMeta(
  tmdbFilePath: string,
  pixelCrop: Area,
  imageWidth: number,
  imageHeight: number,
): ListBannerMeta {
  return buildTmdbStoredImageMeta(tmdbFilePath, pixelCrop, imageWidth, imageHeight)
}

/** URL + posição para cover (foco no centro da área cortada). */
export function listBannerPresentation(
  list: Pick<List, "backdrop_path" | "banner_meta">,
): { src: string | null; objectPosition: string | undefined } {
  const meta = list.banner_meta
  if (meta?.provider === "tmdb" && meta.file_path) {
    const cx = meta.crop.x + meta.crop.w / 2
    const cy = meta.crop.y + meta.crop.h / 2
    return {
      src: tmdbOriginalSrc(meta.file_path),
      objectPosition: `${cx * 100}% ${cy * 100}%`,
    }
  }
  return {
    src: listBackdropImageSrc(list.backdrop_path),
    objectPosition: undefined,
  }
}
