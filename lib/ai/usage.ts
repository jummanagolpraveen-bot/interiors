import { SupabaseClient } from '@supabase/supabase-js'

const FREE_LIMITS = {
  analysis: 3,
  generation: 5,
}

export class UsageLimitExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsageLimitExceededError'
  }
}

export async function checkUsageLimit(
  supabase: SupabaseClient, 
  userId: string, 
  actionType: 'analysis' | 'generation'
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  if (profile?.plan === 'paid') return true; 

  const limit = actionType === 'analysis' ? FREE_LIMITS.analysis : FREE_LIMITS.generation

  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', actionType)

  if ((count || 0) >= limit) {
    throw new UsageLimitExceededError(`You have reached your free tier limit for ${actionType}s (${limit}). Please upgrade your plan.`)
  }

  return true
}
