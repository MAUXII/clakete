/**
 * Same-origin relative path only. Blocks protocol-relative open redirects
 * (`//evil.com`, `/\\evil.com`, etc.) that pass a naive startsWith("/").
 */
export function safeAuthNextPath(next: string | null | undefined): string {
  const fallback = "/sign-in"
  if (!next) return fallback

  let path = next.trim()
  try {
    path = decodeURIComponent(path)
  } catch {
    return fallback
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback
  }
  if (path.includes("\\") || path.includes("://")) {
    return fallback
  }
  if (path.startsWith("/:") || /^\/[\\/]/.test(path)) {
    return fallback
  }

  return path
}
