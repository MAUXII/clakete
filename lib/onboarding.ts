import { z } from "zod"

/** App routes and reserved segments — cannot be used as usernames. */
export const RESERVED_USERNAMES = new Set([
  "account",
  "auth",
  "film",
  "films",
  "list",
  "lists",
  "onboarding",
  "profile",
  "series",
  "sign-in",
  "sign-up",
  "api",
  "admin",
  "settings",
  "billing",
  "discover",
  "popular",
  "upcoming",
  "top-rated",
  "watchlist",
  "activity",
  "reviews",
])

export const usernameSchema = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores")
  .transform((val) => val.toLowerCase())

export const displayNameSchema = z
  .string()
  .max(50, "Display name must be at most 50 characters")
  .optional()

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(username))
}

export function validateUsernameFormat(username: string): string | null {
  const result = usernameSchema.safeParse(username)
  if (!result.success) {
    return result.error.errors[0]?.message ?? "Invalid username"
  }
  if (isReservedUsername(result.data)) {
    return "This username is not available"
  }
  return null
}
