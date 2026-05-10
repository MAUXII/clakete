import type { List } from "@/types/list"

/** URL do perfil no mesmo padrão das rotas dinâmicas (username em minúsculas). */
export function userProfilePath(username: string | undefined | null): string {
  if (!username?.trim()) return "/"
  return `/${username.trim().toLowerCase()}`
}

/** URL usable in `next/image` for list banners (TMDB fragment, `/wavebg.png`, or absolute). */
export function listBackdropImageSrc(backdrop?: string | null): string | null {
  const b = backdrop?.trim()
  if (!b) return null
  if (b.startsWith("http://") || b.startsWith("https://")) return b
  if (b.startsWith("/")) return b
  return `https://image.tmdb.org/t/p/w780/${b.replace(/^\//, "")}`
}

export function listPublicHref(list: Pick<List, "id" | "slug"> & { userData?: { username?: string } }): string {
  const username = list.userData?.username?.toLowerCase()
  const slug = list.slug?.trim()
  if (username && slug) {
    return `/${username}/list/${encodeURIComponent(slug)}`
  }
  return `/lists/${list.id}`
}
