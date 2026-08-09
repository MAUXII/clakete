type CacheEntry<T> = {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

/** Cache em memória com TTL (default 7 min). */
export function getCached<T>(key: string): T | null {
  const hit = store.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    store.delete(key)
    return null
  }
  return hit.value as T
}

export function setCached<T>(
  key: string,
  value: T,
  ttlMs = 7 * 60 * 1000,
): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
