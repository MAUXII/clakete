/** URLs que apontam para GIF (incl. CDN como Tenor em `.../arquivo.gif`). */
export function remoteImageSrcLooksLikeGif(src: string): boolean {
  const t = src.trim().toLowerCase()
  if (!t) return false
  if (t.startsWith("data:image/gif")) return true
  try {
    return new URL(t).pathname.includes(".gif")
  } catch {
    return /\.gif(\?|#|$)/i.test(t)
  }
}

/**
 * Avatar em contextos compactos (navbar, reviews, cards): GIF animado pesa e distrai.
 * Com `allowGifPlayback: false` (padrão), URLs que parecem GIF viram JPEG estático via proxy.
 * Na página de perfil use `allowGifPlayback: true` para manter o GIF a animar.
 */
export function avatarDisplaySrc(
  src: string | null | undefined,
  opts?: { allowGifPlayback?: boolean },
): string | undefined {
  const s = src?.trim()
  if (!s) return undefined
  if (opts?.allowGifPlayback === true || !remoteImageSrcLooksLikeGif(s)) return s
  try {
    return `https://wsrv.nl/?url=${encodeURIComponent(s)}&w=512&h=512&fit=cover&output=jpg`
  } catch {
    return s
  }
}
