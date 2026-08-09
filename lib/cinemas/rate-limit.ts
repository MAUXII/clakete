import type { NextRequest } from "next/server"

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Rate limit simples em memória por chave (IP). */
export function checkRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number },
): { ok: boolean; remaining: number; retryAfterSec: number } {
  const limit = options?.limit ?? Number(process.env.CINEMAS_RATE_LIMIT || 30)
  const windowMs =
    options?.windowMs ?? Number(process.env.CINEMAS_RATE_WINDOW_MS || 60_000)
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || now > current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  if (current.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.ceil((current.resetAt - now) / 1000),
    }
  }

  current.count += 1
  return {
    ok: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSec: 0,
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}

export function assertCinemasSecret(request: NextRequest): boolean {
  const expected = process.env.CINEMAS_API_SECRET
  if (!expected) return true
  const provided =
    request.headers.get("x-clakete-cinemas-secret") ||
    request.nextUrl.searchParams.get("secret")
  return provided === expected
}
