import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY; // service_role / secret key — server only
// "SUPABSE_..." was a typo in the original .env.example; still accepted so existing .env files keep working.
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABSE_PUBLISHABLE_KEY;

if (!supabaseUrl || !secretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy .env.example to .env and fill them in.');
  process.exit(1);
}

// The backend never keeps a session: every request is authenticated by the
// bearer token the browser sends, and tokens are verified with Supabase Auth.
const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

/**
 * Privileged client (secret key, bypasses RLS). Use ONLY for database access and
 * admin calls, and always filter by the authenticated user's id. Never call
 * signInWithPassword/signUp on it: doing so would swap the shared client's
 * credentials for the end user's and break every later query.
 */
export const supabase = createClient(supabaseUrl, secretKey, clientOptions);

if (!publishableKey) {
  console.warn('SUPABASE_PUBLISHABLE_KEY is not set; auth calls will use the secret key. Set it for production.');
}

/** A fresh, isolated client for end-user auth calls (signUp / signIn / refresh). */
export function createAuthClient() {
  return createClient(supabaseUrl, publishableKey || secretKey, clientOptions);
}
