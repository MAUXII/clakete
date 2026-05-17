import type { SupabaseClient } from '@supabase/supabase-js'
import { userProfilePath } from '@/lib/list-href'

/** Where to send a signed-in user based on `public.users` row. */
export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: profile, error } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('post-auth redirect lookup failed:', error)
    return '/onboarding'
  }

  if (!profile?.username) {
    return '/onboarding'
  }

  return userProfilePath(profile.username)
}
