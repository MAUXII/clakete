import type { SupabaseClient } from "@supabase/supabase-js"
import { isReservedUsername, normalizeUsername, validateUsernameFormat } from "@/lib/onboarding"

export type UsernameAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "reserved"
  | "invalid"

export type UsernameAvailabilityResult = {
  status: UsernameAvailabilityStatus
  message: string | null
}

export async function checkUsernameAvailability(
  supabase: SupabaseClient,
  rawUsername: string,
  options?: { excludeUserId?: string },
): Promise<UsernameAvailabilityResult> {
  const username = normalizeUsername(rawUsername)

  if (!username) {
    return { status: "idle", message: null }
  }

  const formatError = validateUsernameFormat(username)
  if (formatError) {
    return {
      status: isReservedUsername(username) ? "reserved" : "invalid",
      message: formatError,
    }
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (error) {
    return { status: "invalid", message: "Could not check username. Try again." }
  }

  if (data?.id && options?.excludeUserId && data.id === options.excludeUserId) {
    return { status: "available", message: null }
  }

  if (data?.id) {
    return { status: "taken", message: "This username is already taken" }
  }

  return { status: "available", message: null }
}
