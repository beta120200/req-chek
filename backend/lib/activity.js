import { supabase } from '../config/supabase.js';

/** Appends to the user's activity feed. Never throws: the feed is cosmetic. */
export async function logActivity(userId, title) {
  try {
    const { error } = await supabase.from('user_activity').insert({ user_id: userId, title: String(title).slice(0, 255) });
    if (error) console.warn('Could not log activity:', error.message);
  } catch (err) {
    console.warn('Could not log activity:', err.message);
  }
}

/** Newest-first activity entries (default 8) in the shape the client uses. */
export async function fetchActivity(userId, limit = 8) {
  const { data, error } = await supabase
    .from('user_activity')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('Could not load activity:', error.message);
    return [];
  }
  return data.map((a) => ({ id: a.id, title: a.title, createdAt: a.created_at }));
}
