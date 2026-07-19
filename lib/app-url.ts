/** Origin of the current browser tab — correct for OAuth on any host. */
export function getClientOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  )
}

/**
 * Origin for server redirects after OAuth.
 * Prefer the request host so a missing/wrong NEXT_PUBLIC_SITE_URL
 * cannot send production users to localhost.
 */
export function getRequestOrigin(requestUrl: URL): string {
  return requestUrl.origin
}
