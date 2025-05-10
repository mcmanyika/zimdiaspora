import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

let supabaseClient = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}

export const clearSupabaseClient = () => {
  supabaseClient = null
} 