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
