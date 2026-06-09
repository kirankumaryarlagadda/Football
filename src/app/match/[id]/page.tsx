import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import { autoUpdateMatchStatuses } from '@/lib/auto-status';
import MatchDetailClient from './MatchDetailClient';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await autoUpdateMatchStatuses();

  const { data: match } = await supabaseAdmin
    .from('fwc_matches')
    .select('*')
    .eq('id', id)
    .single();

  if (!match) notFound();

  const { data: picks } = await supabase
    .from('fwc_picks')
    .select('*')
    .eq('match_id', id);

  const { data: userPick } = await supabaseAdmin
    .from('fwc_picks')
    .select('*')
    .eq('match_id', id)
    .eq('user_id', user.id)
    .single();

  // Total pick count (admin query, bypasses RLS)
  const { count } = await supabaseAdmin
    .from('fwc_picks')
    .select('*', { count: 'exact', head: true })
    .eq('match_id', id);

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, display_name')
    .eq('is_approved', true);

  return (
    <MatchDetailClient
      match={match}
      picks={picks || []}
      userPick={userPick}
      userId={user.id}
      profiles={profiles || []}
      totalPickCount={count || 0}
    />
  );
}
