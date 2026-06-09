import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/');

  const { data: matches } = await supabaseAdmin
    .from('fwc_matches')
    .select('*')
    .order('match_number', { ascending: true });

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  // Get prizes
  const { data: prizesData } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'fwc_prizes')
    .single();

  return (
    <AdminClient
      matches={matches || []}
      profiles={profiles || []}
      prizes={prizesData?.value || null}
      userId={user.id}
    />
  );
}
