export const USER_PLANS = ["free", "shining"] as const
export type UserPlan = (typeof USER_PLANS)[number]

export type PlanStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | null

export interface PlanFields {
  plan?: string | null
  plan_status?: string | null
  plan_current_period_end?: string | null
}

export function isShiningPlan(plan: string | null | undefined): plan is "shining" {
  return plan === "shining"
}

/** Premium ativo para badge/UI (inclui cancel_at_period_end até fim do período). */
export function hasShiningAccess(fields: PlanFields): boolean {
  if (!isShiningPlan(fields.plan)) return false

  const status = fields.plan_status
  if (status === "active" || status === "trialing" || status === "past_due") {
    return true
  }

  const end = fields.plan_current_period_end
  if (!end) return false

  const endMs = new Date(end).getTime()
  if (Number.isNaN(endMs)) return false

  return endMs > Date.now()
}

export const SHINING_PRODUCT_NAME = "The Shining"

/** Free accounts can keep this many private lists; Shining is unlimited. */
export const FREE_PRIVATE_LIST_LIMIT = 3

export const PROFILE_THEMES = [
  { id: "default", label: "Default", hint: "Clakete classic" },
  { id: "overlook", label: "Overlook", hint: "Warm gold text & atmosphere" },
  { id: "noir", label: "Noir", hint: "Full black & white profile" },
  { id: "rose", label: "Rose", hint: "Soft crimson tint" },
] as const

export type ProfileThemeId = (typeof PROFILE_THEMES)[number]["id"]

export function isProfileThemeId(value: unknown): value is ProfileThemeId {
  return (
    typeof value === "string" &&
    PROFILE_THEMES.some((t) => t.id === value)
  )
}

/** Marketing bullets for The Shining (pricing + landing). */
export const SHINING_FEATURE_BULLETS = [
  "Everything in Free",
  "Premium badge on your profile and feed",
  "Profile themes (Overlook, Noir, Rose)",
  `Unlimited private lists (Free: ${FREE_PRIVATE_LIST_LIMIT})`,
  "Early access to new features",
] as const

export const FREE_FEATURE_BULLETS = [
  "Diary: watched, ratings, and dates",
  "Reviews and public lists",
  `Up to ${FREE_PRIVATE_LIST_LIMIT} private lists`,
  "Full public profile",
] as const
