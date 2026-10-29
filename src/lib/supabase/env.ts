// Public Supabase settings. Both values are sent to the browser by design —
// the publishable key identifies the project, it does not grant access. Row
// Level Security decides what a request may read. A service_role or secret key
// must never appear here, or in any NEXT_PUBLIC_ variable.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * Until a publishable key is set the app keeps running on its mock data, so
 * every Supabase entry point checks this instead of throwing at boot.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
