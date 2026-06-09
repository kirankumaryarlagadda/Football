import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { match_id, winner } = await request.json();

  const { data: match } = await supabaseAdmin.from('fwc_matches').select('team1, team2, stage').eq('id', match_id).single();
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const validWinners = [match.team1, match.team2, 'NR'];
  if (match.stage === 'group') validWinners.push('DRAW');
  if (!validWinners.includes(winner)) return NextResponse.json({ error: 'Invalid winner' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('fwc_matches')
    .update({ winner, status: 'completed' })
    .eq('id', match_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
