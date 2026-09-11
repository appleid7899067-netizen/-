import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | undefined

export function getSupabaseBrowserClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment is not configured')
  }

  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  })

  return client
}

export type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowserClient>

export async function ensureAnonymousSession() {
  const supabase = getSupabaseBrowserClient()
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user) return sessionData.session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw error ?? new Error('Anonymous Supabase session unavailable')
  }
  return data.user
}
