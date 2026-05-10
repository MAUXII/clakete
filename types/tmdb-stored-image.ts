/** TMDB `file_path` + área de crop normalizada (0–1); sem Storage. Igual ao legado das listas. */
export interface TmdbStoredImageMeta {
  provider: "tmdb"
  file_path: string
  crop: { x: number; y: number; w: number; h: number }
}
