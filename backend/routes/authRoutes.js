import express from 'express';
import { supabase, createAuthClient } from '../config/supabase.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6; // keep in sync with Supabase Auth > Password settings

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null,
  };
}

function publicSession(session) {
  if (!session) return null;
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at, // unix seconds
    expiresIn: session.expires_in,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawPassword = typeof password === 'string' ? password : '';

  if (!trimmedName || !trimmedEmail || !rawPassword) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (!EMAIL_RE.test(trimmedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (rawPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  try {
    const { data, error } = await createAuthClient().auth.signUp({
      email: trimmedEmail,
      password: rawPassword,
      options: { data: { name: trimmedName } },
    });

    if (error) {
      return res.status(error.status === 429 ? 429 : 400).json({ error: error.message });
    }

    // With "Confirm email" enabled, Supabase returns a fake user with no identities
    // (instead of an error) when the address is already registered.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    return res.status(201).json({
      user: publicUser(data.user),
      session: publicSession(data.session),
      // No session = the project requires email confirmation before first sign-in.
      needsEmailConfirmation: !data.session,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const rawPassword = typeof password === 'string' ? password : '';

  if (!trimmedEmail || !rawPassword) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email: trimmedEmail,
      password: rawPassword,
    });

    if (error) {
      const status = error.status === 429 ? 429 : error.status >= 500 ? 503 : 401;
      return res.status(status).json({ error: error.message });
    }

    return res.json({ user: publicUser(data.user), session: publicSession(data.session) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh  { refreshToken } -> new session
router.post('/refresh', async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (typeof refreshToken !== 'string' || !refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  try {
    const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) {
      return res.status(401).json({ error: error?.message || 'Session expired. Please log in again.' });
    }
    return res.json({ user: publicUser(data.user), session: publicSession(data.session) });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout  (Authorization: Bearer <access token>)
router.post('/logout', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (token) {
    try {
      // Revokes this session's refresh token on Supabase's side.
      const { error } = await supabase.auth.admin.signOut(token, 'local');
      if (error) console.warn('Supabase signOut warning:', error.message);
    } catch (err) {
      console.warn('Supabase signOut failed:', err.message);
    }
  }
  // Logging out should always succeed from the client's point of view.
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: publicUser(req.user) });
});

export default router;
