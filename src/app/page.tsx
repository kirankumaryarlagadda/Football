import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { autoUpdateMatchStatuses } from '@/lib/auto-status';
import MatchesDashboard from './MatchesDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await autoUpdateMatchStatuses();

  const { data: matches } = await supabase
    .from('fwc_matches')
    .select('*')
    .order('match_number', { ascending: true });

  const { data: picks } = await supabase
    .from('fwc_picks')
    .select('*')
    .eq('user_id', user.id);

  const { data: allPicks } = await supabase
    .from('fwc_picks')
    .select('match_id, picked_team');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return (
    <MatchesDashboard
      matches={matches || []}
      userPicks={picks || []}
      allPicks={allPicks || []}
      userId={user.id}
      isAdmin={profile?.is_admin || false}
    />
  );
}
