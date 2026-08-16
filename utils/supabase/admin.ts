import { createClient } from '@supabase/supabase-js'

// Admin client with service role key that bypasses RLS.
//
// Validation lives inside the factory (not at module top level) so that
// importing this module does not throw during `next build`'s page-data
// collection, where env vars for real services are intentionally absent.
export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}