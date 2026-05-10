/** URLs que apontam para GIF (incl. CDN como Tenor em `.../arquivo.gif`). */
export function remoteImageSrcLooksLikeGif(src: string): boolean {
  const t = src.trim().toLowerCase()
  if (!t) return false
  try {
    return new URL(t).pathname.includes(".gif")
  } catch {
    return /\.gif(\?|#|$)/i.test(t)
  }
}
