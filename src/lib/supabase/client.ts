'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Returns `null` when the environment is not configured, which puts the app
 * into "local demo" mode (see `src/lib/data/local-provider.ts`).
 */
let client: ReturnType<typeof createBrowserClient> | null = null

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export function getSupabaseBrowser() {
  if (!supabaseConfigured) return null
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  )
  return client
}
