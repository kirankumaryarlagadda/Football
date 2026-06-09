import { supabaseAdmin } from './supabase/admin';

export async function autoUpdateMatchStatuses() {
  const now = new Date().toISOString();
  
  const { error } = await supabaseAdmin
    .from('fwc_matches')
    .update({ status: 'live' })
    .eq('status', 'upcoming')
    .lte('match_date', now);

  if (error) {
    console.error('Auto-update status error:', error);
  }
}
