import type { List } from "@/types/list"

/** URL do perfil no mesmo padrão das rotas dinâmicas (username em minúsculas). */
export function userProfilePath(username: string | undefined | null): string {
  if (!username?.trim()) return "/"
  return `/${username.trim().toLowerCase()}`
}

export function listPublicHref(list: Pick<List, "id" | "slug"> & { userData?: { username?: string } }): string {
  const username = list.userData?.username?.toLowerCase()
  const slug = list.slug?.trim()
  if (username && slug) {
    return `/${username}/list/${encodeURIComponent(slug)}`
  }
  return `/lists/${list.id}`
}
