import { supabase } from '../config/supabase.js';

// public.users has a foreign key to auth.users and user_documents/user_services
// point at public.users. The recommended fix is the trigger in database_patch.sql;
// this keeps things working for accounts created before the trigger existed.
const knownProfiles = new Set();

async function ensureUserProfile(user) {
  if (knownProfiles.has(user.id)) return;
  const { error } = await supabase
    .from('users')
    .upsert(
      { id: user.id, email: user.email, full_name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  if (error) {
    console.error('Could not ensure user profile row:', error.message);
    return;
  }
  if (knownProfiles.size > 10_000) knownProfiles.clear();
  knownProfiles.add(user.id);
}

/**
 * Reads "Authorization: Bearer <supabase access token>" and verifies it with Supabase Auth.
 * @returns {Promise<{ user: object|null, status?: number, error?: string }>}
 */
async function resolveUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return { user: null, status: 401, error: 'Authentication required' };

  const token = header.slice(7).trim();
  if (!token) return { user: null, status: 401, error: 'Authentication required' };

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      // Supabase being unreachable is not the same as a bad token.
      if (error && (error.name === 'AuthRetryableFetchError' || (error.status && error.status >= 500))) {
        return { user: null, status: 503, error: 'Authentication service unavailable' };
      }
      return { user: null, status: 401, error: 'Invalid or expired token' };
    }
    return { user: data.user };
  } catch (err) {
    console.error('Auth middleware exception:', err);
    return { user: null, status: 503, error: 'Authentication service unavailable' };
  }
}

/** Requires a valid Supabase session. Responds 401 otherwise. */
export async function authenticate(req, res, next) {
  const result = await resolveUser(req);
  if (!result.user) return res.status(result.status).json({ error: result.error });
  await ensureUserProfile(result.user);
  req.user = result.user;
  next();
}

/**
 * Lets guests (no Authorization header) through with req.user = null for public
 * catalog data. If a token IS supplied it must be valid.
 */
const MAX_GUEST_HEADER_LENGTH = 8000;

function parseGuestContext(req) {
  const raw = req.headers['x-guest-context'];
  if (typeof raw !== 'string' || !raw || raw.length > MAX_GUEST_HEADER_LENGTH) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export async function optionalAuthenticate(req, res, next) {
  const hasToken = (req.headers.authorization || '').startsWith('Bearer ');
  if (!hasToken) {
    req.user = null;
    req.guest = parseGuestContext(req);
    return next();
  }
  const result = await resolveUser(req);
  // A token was sent but is bad/expired: say so (401) so the client can refresh it,
  // rather than silently treating a signed-in user as a guest.
  if (!result.user) return res.status(result.status).json({ error: result.error });
  await ensureUserProfile(result.user);
  req.user = result.user;
  next();
}
